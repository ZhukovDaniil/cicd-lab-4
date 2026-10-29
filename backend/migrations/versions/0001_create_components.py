"""Create components table."""
from alembic import op
import sqlalchemy as sa

revision = "0001_components"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "components",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("manufacturer", sa.String(length=100), nullable=False, server_default="Unknown"),
        sa.Column("price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_components_id", "components", ["id"])
    op.create_index("ix_components_name", "components", ["name"])
    op.create_index("ix_components_category", "components", ["category"])

def downgrade():
    op.drop_index("ix_components_category", table_name="components")
    op.drop_index("ix_components_name", table_name="components")
    op.drop_index("ix_components_id", table_name="components")
    op.drop_table("components")
