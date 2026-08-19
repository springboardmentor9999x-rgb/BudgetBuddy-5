"""update notification fields

Revision ID: 753ccd7808f2
Revises:
Create Date: 2026-08-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "753ccd7808f2"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ==================================================
# UPGRADE
# ==================================================

def upgrade() -> None:

    # ----------------------------------------------
    # ADD notification_type
    # ----------------------------------------------

    op.add_column(
        "notifications",
        sa.Column(
            "notification_type",
            sa.String(length=50),
            nullable=True
        )
    )


    # ----------------------------------------------
    # ADD is_read
    # Existing notifications will get False
    # ----------------------------------------------

    op.add_column(
        "notifications",
        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false")
        )
    )


    # ----------------------------------------------
    # ADD created_at
    # ----------------------------------------------

    op.add_column(
        "notifications",
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True
        )
    )


    # ----------------------------------------------
    # UPDATE EXISTING NOTIFICATIONS
    # ----------------------------------------------

    op.execute(
        """
        UPDATE notifications
        SET notification_type = 'general'
        WHERE notification_type IS NULL
        """
    )


    # ----------------------------------------------
    # MAKE notification_type REQUIRED
    # ----------------------------------------------

    op.alter_column(
        "notifications",
        "notification_type",
        nullable=False
    )


    # ----------------------------------------------
    # REMOVE OLD status COLUMN
    # ----------------------------------------------

    op.drop_column(
        "notifications",
        "status"
    )


# ==================================================
# DOWNGRADE
# ==================================================

def downgrade() -> None:

    # ----------------------------------------------
    # ADD BACK OLD status COLUMN
    # ----------------------------------------------

    op.add_column(
        "notifications",
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=True
        )
    )


    # ----------------------------------------------
    # REMOVE created_at
    # ----------------------------------------------

    op.drop_column(
        "notifications",
        "created_at"
    )


    # ----------------------------------------------
    # REMOVE is_read
    # ----------------------------------------------

    op.drop_column(
        "notifications",
        "is_read"
    )


    # ----------------------------------------------
    # REMOVE notification_type
    # ----------------------------------------------

    op.drop_column(
        "notifications",
        "notification_type"
    )