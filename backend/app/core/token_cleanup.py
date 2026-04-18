import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import delete, or_

from app.db.database import SessionLocal
from app.models.models import RefreshToken

logger = logging.getLogger(__name__)

# Daily cleanup interval.
REFRESH_TOKEN_CLEANUP_INTERVAL_SECONDS = 24 * 60 * 60


def delete_revoked_refresh_tokens() -> int:
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        result = db.execute(
            delete(RefreshToken).where(
                or_(
                    RefreshToken.is_revoked.is_(True),
                    RefreshToken.expires_at < now,
                )
            )
        )
        db.commit()
        return int(result.rowcount or 0)
    finally:
        db.close()


async def refresh_token_cleanup_loop() -> None:
    while True:
        try:
            deleted_count = delete_revoked_refresh_tokens()
            if deleted_count:
                logger.info(
                    "Refresh token cleanup completed: deleted %s revoked token(s).",
                    deleted_count,
                )
        except Exception:
            logger.exception("Refresh token cleanup job failed.")

        await asyncio.sleep(REFRESH_TOKEN_CLEANUP_INTERVAL_SECONDS)
