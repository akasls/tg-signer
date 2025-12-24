"""
配置管理 API 路由
提供任务配置的导入导出功能
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.core.auth import get_current_user
from backend.models.user import User
from backend.services.config import config_service

router = APIRouter()


# ============ Schemas ============

class ExportTaskResponse(BaseModel):
    """导出任务响应"""
    task_name: str
    task_type: str
    config_json: str


class ImportTaskRequest(BaseModel):
    """导入任务请求"""
    config_json: str
    task_name: Optional[str] = None  # 新任务名称（可选）


class ImportTaskResponse(BaseModel):
    """导入任务响应"""
    success: bool
    task_name: str
    message: str


class ImportAllRequest(BaseModel):
    """导入所有配置请求"""
    config_json: str
    overwrite: bool = False  # 是否覆盖已存在的配置


class ImportAllResponse(BaseModel):
    """导入所有配置响应"""
    signs_imported: int
    signs_skipped: int
    monitors_imported: int
    monitors_skipped: int
    errors: list[str]
    message: str


class TaskListResponse(BaseModel):
    """任务列表响应"""
    sign_tasks: list[str]
    monitor_tasks: list[str]
    total: int


# ============ API Routes ============

@router.get("/tasks", response_model=TaskListResponse)
def list_all_tasks(current_user: User = Depends(get_current_user)):
    """
    获取所有任务列表（签到任务和监控任务）
    """
    try:
        sign_tasks = config_service.list_sign_tasks()
        monitor_tasks = config_service.list_monitor_tasks()
        
        return TaskListResponse(
            sign_tasks=sign_tasks,
            monitor_tasks=monitor_tasks,
            total=len(sign_tasks) + len(monitor_tasks)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取任务列表失败: {str(e)}"
        )


@router.get("/export/sign/{task_name}")
def export_sign_task(
    task_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    导出单个签到任务配置
    
    返回 JSON 格式的配置文件，可以保存后导入
    """
    try:
        config_json = config_service.export_sign_task(task_name)
        
        if config_json is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"任务 {task_name} 不存在"
            )
        
        # 返回 JSON 响应，设置下载文件名
        return JSONResponse(
            content=config_json,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="{task_name}_config.json"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导出任务失败: {str(e)}"
        )


@router.post("/import/sign", response_model=ImportTaskResponse)
def import_sign_task(
    request: ImportTaskRequest,
    current_user: User = Depends(get_current_user)
):
    """
    导入签到任务配置
    
    可以指定新的任务名称，如果不指定则使用原名称
    """
    try:
        success = config_service.import_sign_task(
            request.config_json,
            request.task_name
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="导入失败，配置格式无效"
            )
        
        # 确定最终的任务名称
        import json
        data = json.loads(request.config_json)
        final_task_name = request.task_name or data.get("task_name", "imported_task")
        
        return ImportTaskResponse(
            success=True,
            task_name=final_task_name,
            message=f"任务 {final_task_name} 导入成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导入任务失败: {str(e)}"
        )


@router.get("/export/all")
def export_all_configs(current_user: User = Depends(get_current_user)):
    """
    导出所有配置（签到任务和监控任务）
    
    返回包含所有配置的 JSON 文件
    """
    try:
        config_json = config_service.export_all_configs()
        
        # 返回 JSON 响应，设置下载文件名
        return JSONResponse(
            content=config_json,
            media_type="application/json",
            headers={
                "Content-Disposition": 'attachment; filename="tg_signer_all_configs.json"'
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导出所有配置失败: {str(e)}"
        )


@router.post("/import/all", response_model=ImportAllResponse)
def import_all_configs(
    request: ImportAllRequest,
    current_user: User = Depends(get_current_user)
):
    """
    导入所有配置
    
    可以选择是否覆盖已存在的配置
    """
    try:
        result = config_service.import_all_configs(
            request.config_json,
            request.overwrite
        )
        
        # 构建消息
        message_parts = []
        if result["signs_imported"] > 0:
            message_parts.append(f"导入了 {result['signs_imported']} 个签到任务")
        if result["signs_skipped"] > 0:
            message_parts.append(f"跳过了 {result['signs_skipped']} 个已存在的签到任务")
        if result["monitors_imported"] > 0:
            message_parts.append(f"导入了 {result['monitors_imported']} 个监控任务")
        if result["monitors_skipped"] > 0:
            message_parts.append(f"跳过了 {result['monitors_skipped']} 个已存在的监控任务")
        
        message = "，".join(message_parts) if message_parts else "没有导入任何配置"
        
        return ImportAllResponse(
            **result,
            message=message
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导入所有配置失败: {str(e)}"
        )


@router.delete("/sign/{task_name}")
def delete_sign_task(
    task_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除签到任务配置
    
    注意：删除后无法恢复
    """
    try:
        success = config_service.delete_sign_config(task_name)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"任务 {task_name} 不存在"
            )
        
        return {"success": True, "message": f"任务 {task_name} 已删除"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除任务失败: {str(e)}"
        )
