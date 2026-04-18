import resend

from app.core.config import MAIL_FROM, RESEND_API_KEY

resend.api_key = RESEND_API_KEY


def send_email(to: str, subject: str, body: str) -> bool:
    try:
        resend.Emails.send(
            {
                "from": MAIL_FROM,
                "to": to,
                "subject": subject,
                "text": body,
            }
        )
        return True
    except Exception as e:
        print(f"Resend error: {e}")
        return False


def send_otp_email(to: str, otp: str, purpose: str) -> bool:
    subjects = {
        "verify": "VectorNest — Verify your email",
        "reset": "VectorNest — Password reset OTP",
    }
    bodies = {
        "verify": f"Your email verification OTP is: {otp}\n\nThis OTP expires in 3 minutes.",
        "reset": f"Your password reset OTP is: {otp}\n\nThis OTP expires in 3 minutes.",
    }
    return send_email(to, subjects[purpose], bodies[purpose])


def send_reset_email(to: str, token: str) -> bool:
    from app.core.config import FRONTEND_URL

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = "VectorNest — Reset your password"
    body = (
        f"Click the link below to reset your password:\n\n"
        f"{reset_link}\n\n"
        f"This link expires in 3 minutes."
    )
    return send_email(to, subject, body)
