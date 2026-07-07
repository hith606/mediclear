import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Counterfeit Medicine Detection System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(default="supersecretkeythatnobodywillguess1234567890", validation_alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for easier development/testing

    MONGODB_URL: str = Field(default="mongodb://localhost:27017", validation_alias="MONGODB_URL")
    DATABASE_NAME: str = Field(default="mediclear", validation_alias="DATABASE_NAME")

    # Email & SMS API Mock Options
    MOCK_NOTIFICATIONS: bool = True
    TWILIO_ACCOUNT_SID: str = "ACmockaccountsid"
    TWILIO_AUTH_TOKEN: str = "mockauthtoken"
    TWILIO_FROM_NUMBER: str = "+15017122661"
    SENDGRID_API_KEY: str = "SG.mockkey"
    FROM_EMAIL: str = "alerts@mediclear-supplychain.com"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
