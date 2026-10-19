from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit import AuditEvent
from app.models.background_job import BackgroundJob
from app.schemas.audit import AuditEventRead
from app.schemas.user import UserSummary
from app.services.async_queue_service import AsyncQueueService

router = APIRouter(prefix="/api/v1", tags=["Audit & Background Tasks"])


@router.get("/audit/work-items/{work_item_id}", response_model=List[AuditEventRead])
async def get_work_item_audit_history(
    work_item_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the immutable chronological history of all actions performed on a work item.
    """
    stmt = (
        select(AuditEvent)
        .where(AuditEvent.work_item_id == work_item_id)
        .options(selectinload(AuditEvent.actor))
        .order_by(AuditEvent.created_at.desc())
    )
    result = await db.execute(stmt)
    events = result.scalars().all()

    return [
        AuditEventRead(
            id=e.id,
            work_item_id=e.work_item_id,
            actor_id=e.actor_id,
            action_type=e.action_type,
            old_values=e.old_values,
            new_values=e.new_values,
            context_note=e.context_note,
            created_at=e.created_at,
            actor=UserSummary(
                id=e.actor.id,
                name=e.actor.name,
                email=e.actor.email,
                avatar_url=e.actor.avatar_url
            ) if e.actor else None
        )
        for e in events
    ]


@router.post("/async-jobs/run")
async def trigger_async_job_runner(
    db: AsyncSession = Depends(get_db)
):
    """
    Processes pending asynchronous jobs from the durable queue.
    """
    processed = await AsyncQueueService.run_pending_jobs(db, limit=20)
    return {"status": "success", "processed_jobs_count": processed}


@router.get("/async-jobs")
async def list_async_jobs(
    db: AsyncSession = Depends(get_db)
):
    """
    Inspects background queue tasks, retry counts, and dead-letter errors.
    """
    stmt = select(BackgroundJob).order_by(BackgroundJob.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    return jobs
