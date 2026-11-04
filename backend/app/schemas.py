from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    id: int
    email: str | None
    full_name: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class AuthCodeExchange(BaseModel):
    code: str = Field(min_length=32, max_length=128)


class ProgressUpdate(BaseModel):
    percent_complete: int = Field(ge=0, le=100)

