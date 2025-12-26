"""
账号管理 API 路由（重构版）
基于原项目逻辑，使用手机号登录
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.core.auth import get_current_user
from backend.models.user import User
from backend.services.telegram import telegram_service

router = APIRouter()


# ============ Schemas ============

class LoginStartRequest(BaseModel):
    """开始登录请求"""
    account_name: str
    phone_number: str
    proxy: Optional[str] = None


class LoginStartResponse(BaseModel):
    """开始登录响应"""
    phone_code_hash: str
    phone_number: str
    account_name: str
    message: str = "验证码已发送到您的手机"


class LoginVerifyRequest(BaseModel):
    """验证登录请求"""
    account_name: str
    phone_number: str
    phone_code: str
    phone_code_hash: str
    password: Optional[str] = None  # 2FA 密码
    proxy: Optional[str] = None


class LoginVerifyResponse(BaseModel):
    """验证登录响应"""
    success: bool
    user_id: Optional[int] = None
    first_name: Optional[str] = None
    username: Optional[str] = None
    message: str


class AccountInfo(BaseModel):
    """账号信息"""
    name: str
    session_file: str
    exists: bool
    size: int


class AccountListResponse(BaseModel):
    """账号列表响应"""
    accounts: list[AccountInfo]
    total: int


class DeleteAccountResponse(BaseModel):
    """删除账号响应"""
    success: bool
    message: str


# ============ API Routes ============

@router.post("/login/start", response_model=LoginStartResponse)
async def start_account_login(
    request: LoginStartRequest,
    current_user: User = Depends(get_current_user)
):
    """
    开始账号登录流程（发送验证码）
    
    1. 用户输入账号名和手机号
    2. 系统发送验证码到手机
    3. 返回 phone_code_hash 用于后续验证
    """
    try:
        result = await telegram_service.start_login(
            account_name=request.account_name,
            phone_number=request.phone_number,
            proxy=request.proxy
        )
        
        return LoginStartResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"发送验证码失败: {str(e)}"
        )


@router.post("/login/verify", response_model=LoginVerifyResponse)
async def verify_account_login(
    request: LoginVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    验证账号登录（输入验证码和可选的2FA密码）
    
    1. 用户输入验证码
    2. 如果启用了2FA，还需要输入2FA密码
    3. 验证成功后，生成 session 文件
    """
    try:
        result = await telegram_service.verify_login(
            account_name=request.account_name,
            phone_number=request.phone_number,
            phone_code=request.phone_code,
            phone_code_hash=request.phone_code_hash,
            password=request.password,
            proxy=request.proxy
        )
        
        return LoginVerifyResponse(
            success=True,
            user_id=result.get("user_id"),
            first_name=result.get("first_name"),
            username=result.get("username"),
            message="登录成功"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录验证失败: {str(e)}"
        )


@router.get("", response_model=AccountListResponse)
def list_accounts(current_user: User = Depends(get_current_user)):
    """
    获取所有账号列表
    
    返回所有 session 文件对应的账号
    """
    try:
        accounts = telegram_service.list_accounts()
        
        return AccountListResponse(
            accounts=[AccountInfo(**acc) for acc in accounts],
            total=len(accounts)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取账号列表失败: {str(e)}"
        )


@router.delete("/{account_name}", response_model=DeleteAccountResponse)
def delete_account(
    account_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除账号（删除 session 文件）
    
    注意：删除后无法恢复，需要重新登录
    """
    try:
        success = telegram_service.delete_account(account_name)
        
        if success:
            return DeleteAccountResponse(
                success=True,
                message=f"账号 {account_name} 已删除"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"账号 {account_name} 不存在"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除账号失败: {str(e)}"
        )


@router.get("/{account_name}/exists")
def check_account_exists(
    account_name: str,
    current_user: User = Depends(get_current_user)
):
    """检查账号是否存在"""
    exists = telegram_service.account_exists(account_name)
    return {"exists": exists, "account_name": account_name}


class AccountLogItem(BaseModel):
    """账号日志项"""
    id: int
    account_name: str
    task_name: str
    message: str
    success: bool
    created_at: str


@router.get("/{account_name}/logs", response_model=list[AccountLogItem])
def get_account_logs(
    account_name: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """
    获取账号的任务执行日志
    基于签到任务的 last_run 信息
    """
    from backend.services.sign_tasks import sign_task_service
    
    # 获取该账号的所有任务
    all_tasks = sign_task_service.list_tasks()
    account_tasks = [t for t in all_tasks if t.get("account_name") == account_name]
    
    logs = []
    log_id = 1
    
    for task in account_tasks:
        last_run = task.get("last_run")
        if last_run:
            logs.append(AccountLogItem(
                id=log_id,
                account_name=account_name,
                task_name=task.get("name", "未知任务"),
                message=last_run.get("message", "执行完成" if last_run.get("success") else "执行失败"),
                success=last_run.get("success", False),
                created_at=last_run.get("time", "")
            ))
            log_id += 1
    
    # 按时间倒序排列
    logs.sort(key=lambda x: x.created_at, reverse=True)
    
    return logs[:limit]
