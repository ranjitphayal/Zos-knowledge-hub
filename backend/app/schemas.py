from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserResponse(BaseModel):
    id: int
    email: str | None
    full_name: str
    avatar_url: str | None

    model_config = ConfigDict(from_attributes=True)


class AuthCodeExchange(BaseModel):
    code: str = Field(min_length=32, max_length=128)


class EmailRegistration(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=160)
    password: str = Field(min_length=12, max_length=128)


class EmailLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class EmailAddressRequest(BaseModel):
    email: EmailStr


class EmailTokenRequest(BaseModel):
    token: str = Field(min_length=32, max_length=128)


class PasswordResetRequest(EmailTokenRequest):
    password: str = Field(min_length=12, max_length=128)


class ProgressUpdate(BaseModel):
    percent_complete: int = Field(ge=0, le=100)
