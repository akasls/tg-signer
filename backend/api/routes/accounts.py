from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.auth import get_current_user
from backend.core.database import get_db
from backend.models.account import Account
from backend.schemas.account import (
    AccountCreate,
    AccountLoginVerify,
    AccountOut,
    AccountUpdate,
)
from backend.services import accounts as account_service

router = APIRouter()


@router.get("", response_model=list[AccountOut])
def list_accounts(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return account_service.list_accounts(db)


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return account_service.create_account(
        db,
        account_name=payload.account_name,
        api_id=payload.api_id,
        api_hash=payload.api_hash,
        proxy=payload.proxy,
    )


@router.get("/{account_id}", response_model=AccountOut)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = account_service.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: int,
    payload: AccountUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = account_service.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account_service.update_account(
        db,
        account=account,
        api_id=payload.api_id,
        api_hash=payload.api_hash,
        proxy=payload.proxy,
        status=payload.status,
    )


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = account_service.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account_service.delete_account(db, account)
    return {"ok": True}


@router.post("/{account_id}/login/start")
def login_start(
    account_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = account_service.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    result = account_service.start_login(db, account)
    return result


@router.post("/{account_id}/login/verify")
def login_verify(
    account_id: int,
    payload: AccountLoginVerify,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = account_service.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    code = payload.code
    password = payload.password
    result = account_service.verify_login(db, account, code=code, password=password)
    return result

