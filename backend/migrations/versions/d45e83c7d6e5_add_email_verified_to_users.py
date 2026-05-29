"""Add email_verified to users

Revision ID: d45e83c7d6e5
Revises: b92a83c7d6e5
Create Date: 2026-05-28 12:29:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd45e83c7d6e5'
down_revision = 'b92a83c7d6e5'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), server_default='0', nullable=False))

def downgrade() -> None:
    op.drop_column('users', 'email_verified')
