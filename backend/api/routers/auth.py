from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.connection import get_db
from db.models import Account
from core.security import verify_password, create_access_token, create_refresh_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Account).where(Account.username == req.username)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu.")
        
    access_token = create_access_token(subject=user.username, role=user.role)
    refresh_token = create_refresh_token(subject=user.username)
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer", 
        "status": "ok"
    }

@router.post("/refresh")
async def refresh_token(req: RefreshRequest):
    from jose import jwt, JWTError
    from core.security import SECRET_KEY, ALGORITHM
    
    try:
        payload = jwt.decode(req.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Refresh token không hợp lệ")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token đã hết hạn hoặc không hợp lệ")
        
    access_token = create_access_token(subject=username)
    return {"access_token": access_token, "token_type": "bearer"}

from core.security import get_current_user

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user["username"],
        "role": current_user["role"],
        "status": "ok"
    }
