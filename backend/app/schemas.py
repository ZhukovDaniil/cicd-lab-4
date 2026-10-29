from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ComponentBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=80)
    manufacturer: str = Field(default="Unknown", max_length=100)
    price: float = Field(ge=0)
    description: str = Field(default="", max_length=2000)

class ComponentCreate(ComponentBase):
    pass

class ComponentUpdate(ComponentBase):
    pass

class ComponentOut(ComponentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
