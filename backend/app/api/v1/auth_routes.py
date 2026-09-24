from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, decode_token
from app.db.mysql import get_db
from app.models.sql_models import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserResponse,
)
from app.services.auth_service import AuthError, authenticate_user, issue_tokens, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(db, payload)
    except AuthError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    return AuthResponse(user=UserResponse.model_validate(user), tokens=issue_tokens(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, payload)
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e)) from e
    return AuthResponse(user=UserResponse.model_validate(user), tokens=issue_tokens(user))


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest):
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return TokenPair(
        access_token=create_access_token(user_id=decoded["sub"]),
        refresh_token=payload.refresh_token,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
