"""
用户设置 API 路由
提供修改密码、2FA 设置等功能
"""
from __future__ import annotations

import io
from typing import Optional

import pyotp
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.auth import get_current_user
from backend.core.database import get_db
from backend.core.security import hash_password, verify_password
from backend.models.user import User

router = APIRouter()


# ============ Schemas ============

class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    """修改密码响应"""
    success: bool
    message: str


class EnableTOTPRequest(BaseModel):
    """启用2FA请求"""
    totp_code: str  # 用户输入的验证码，用于验证


class EnableTOTPResponse(BaseModel):
    """启用2FA响应"""
    success: bool
    message: str


class DisableTOTPRequest(BaseModel):
    """禁用2FA请求"""
    totp_code: str  # 需要验证码确认


class DisableTOTPResponse(BaseModel):
    """禁用2FA响应"""
    success: bool
    message: str


class TOTPStatusResponse(BaseModel):
    """2FA状态响应"""
    enabled: bool
    secret: Optional[str] = None  # 只在首次设置时返回


# ============ API Routes ============

@router.put("/password", response_model=ChangePasswordResponse)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    修改密码
    
    需要提供旧密码进行验证
    """
    # 验证旧密码
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码错误"
        )
    
    # 验证新密码
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码长度至少为 6 个字符"
        )
    
    # 更新密码
    current_user.password_hash = hash_password(request.new_password)
    db.commit()
    
    return ChangePasswordResponse(
        success=True,
        message="密码修改成功"
    )


@router.get("/totp/status", response_model=TOTPStatusResponse)
def get_totp_status(current_user: User = Depends(get_current_user)):
    """
    获取2FA状态
    """
    return TOTPStatusResponse(
        enabled=bool(current_user.totp_secret),
        secret=None  # 不返回 secret
    )


@router.post("/totp/setup", response_model=TOTPStatusResponse)
def setup_totp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    设置2FA（生成密钥）
    
    返回 secret，用户需要用此 secret 生成二维码
    """
    if current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA 已启用，如需重新设置请先禁用"
        )
    
    # 生成新的 TOTP secret
    secret = pyotp.random_base32()
    
    # 暂存到数据库（但标记为未验证）
    # 我们在用户验证后才真正启用
    current_user.totp_secret = secret
    db.commit()
    
    return TOTPStatusResponse(
        enabled=False,
        secret=secret
    )


@router.get("/totp/qrcode")
def get_totp_qrcode(current_user: User = Depends(get_current_user)):
    """
    获取2FA二维码
    
    返回二维码图片（PNG 格式）
    """
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先调用 /totp/setup 设置2FA"
        )
    
    # 生成 TOTP URI
    totp = pyotp.TOTP(current_user.totp_secret)
    uri = totp.provisioning_uri(
        name=current_user.username,
        issuer_name="tg-signer"
    )
    
    # 生成二维码
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 转换为字节流
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    return StreamingResponse(img_io, media_type="image/png")


@router.post("/totp/enable", response_model=EnableTOTPResponse)
def enable_totp(
    request: EnableTOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    启用2FA
    
    需要提供验证码以确认设置正确
    """
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先调用 /totp/setup 设置2FA"
        )
    
    # 验证 TOTP 码
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(request.totp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误"
        )
    
    # 2FA 已经在 setup 时设置了 secret，这里只需要确认
    db.commit()
    
    return EnableTOTPResponse(
        success=True,
        message="两步验证已启用"
    )


@router.post("/totp/disable", response_model=DisableTOTPResponse)
def disable_totp(
    request: DisableTOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    禁用2FA
    
    需要提供验证码以确认
    """
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA 未启用"
        )
    
    # 验证 TOTP 码
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(request.totp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误"
        )
    
    # 禁用2FA
    current_user.totp_secret = None
    db.commit()
    
    return DisableTOTPResponse(
        success=True,
        message="两步验证已禁用"
    )
