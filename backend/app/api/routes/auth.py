from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.email import send_otp_email, send_reset_email
from app.core.otp import generate_otp, store_otp, verify_otp
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    get_refresh_token_expiry,
    hash_password,
    hash_refresh_token,
    verify_password,
    verify_reset_token,
)
from app.db.database import get_db
from app.models.models import RefreshToken, User
from app.models.schema import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResendOTPRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyOTPRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_tokens(user: User, db: Session) -> dict:
    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token()
    refresh_token_hash = hash_refresh_token(refresh_token)

    db_token = RefreshToken(
        user_id=user.id,
        token_hash=refresh_token_hash,
        expires_at=get_refresh_token_expiry(),
    )
    db.add(db_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        password=hash_password(body.password),
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    otp = generate_otp()
    store_otp(str(user.id), otp, "verify")
    send_otp_email(user.email, otp, "verify")

    return {
        "message": "Account created. Check your email for the verification OTP.",
        "user_id": str(user.id),
    }


@router.post("/verify-email", response_model=TokenResponse)
def verify_email(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    if not verify_otp(str(user.id), body.otp, "verify"):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user.is_verified = True
    return _issue_tokens(user, db)


@router.post("/resend-otp")
def resend_otp(body: ResendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    otp = generate_otp()
    store_otp(str(user.id), otp, "verify")
    send_otp_email(user.email, otp, "verify")

    return {"message": "OTP resent"}


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    return _issue_tokens(user, db)


@router.post("/refresh", response_model=TokenResponse)
def refresh(x_refresh_token: str = Header(...), db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(x_refresh_token)

    db_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash, RefreshToken.is_revoked == False)
        .first()
    )

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    db_token.is_revoked = True

    new_access_token = create_access_token({"sub": str(user.id), "email": user.email})
    new_refresh_token = create_refresh_token()
    new_refresh_hash = hash_refresh_token(new_refresh_token)

    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=new_refresh_hash,
        expires_at=get_refresh_token_expiry(),
    )
    db.add(new_db_token)
    db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.post("/change-password", response_model=TokenResponse)
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    if body.old_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must be different")

    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    current_user.password = hash_password(body.new_password)
    db.commit()

    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id, RefreshToken.is_revoked == False
    ).update({"is_revoked": True})

    return _issue_tokens(current_user, db)


@router.post("/logout")
def logout(x_refresh_token: str = Header(...), db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(x_refresh_token)

    db_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash, RefreshToken.is_revoked == False)
        .first()
    )

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    db_token.is_revoked = True
    db.commit()

    return {"message": "Logged out"}


@router.get("/profile", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    if not user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Account not verified. Please verify your email first",
        )

    token = create_reset_token(str(user.id))
    send_reset_email(user.email, token)

    return {
        "message": "Password reset link sent to your email. It expires in 3 minutes."
    }


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user_id = verify_reset_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if verify_password(body.new_password, user.password):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password",
        )
    user.password = hash_password(body.new_password)

    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id, RefreshToken.is_revoked == False
    ).update({"is_revoked": True})

    db.commit()

    return {"message": "Password reset successfully. Please login again."}
