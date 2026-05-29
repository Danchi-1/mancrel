"""Add image_url to catalogue items

Revision ID: b92a83c7d6e5
Revises: 9f8e7d6c5b4a
Create Date: 2026-05-28 12:28:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b92a83c7d6e5'
down_revision = '232214ef9617'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('catalogue_items', sa.Column('image_url', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('catalogue_items', 'image_url')
