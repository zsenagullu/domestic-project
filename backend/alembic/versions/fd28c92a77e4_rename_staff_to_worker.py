"""rename staff to worker

Revision ID: fd28c92a77e4
Revises: a7bb543372b9
Create Date: 2026-03-26 08:39:43.303529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd28c92a77e4'
down_revision: Union[str, Sequence[str], None] = 'a7bb543372b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename 'staff' to 'worker' in roleenum
    op.execute("ALTER TYPE roleenum RENAME VALUE 'staff' TO 'worker'")

def downgrade() -> None:
    # Rename 'worker' to 'staff' in roleenum
    op.execute("ALTER TYPE roleenum RENAME VALUE 'worker' TO 'staff'")
