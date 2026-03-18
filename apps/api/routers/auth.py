from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import get_db
from deps import get_current_user
from models.user import User
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead
from services.auth import authenticate_user, create_access_token, create_user

router = APIRouter(tags=["auth"])


@router.post("/api/auth/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte avec cet email existe déjà",
        )

    if len(data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Le mot de passe doit contenir au moins 6 caractères",
        )

    user = create_user(db, email=data.email, password=data.password, full_name=data.full_name)
    token = create_access_token(user.id, user.email)

    # Send welcome notification
    try:
        from services.notifications import notify_welcome
        notify_welcome(db, user.id, user.full_name)
        db.commit()
    except Exception:
        pass  # Non-fatal

    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
    )


@router.post("/api/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    token = create_access_token(user.id, user.email)

    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
    )


@router.get("/api/auth/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user."""
    return current_user
