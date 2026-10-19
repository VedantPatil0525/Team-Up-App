import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.background_job import BackgroundJob, JobStatus

logger = logging.getLogger("async_queue")


class AsyncQueueService:
    @staticmethod
    async def enqueue_job(
        db: AsyncSession,
        job_type: str,
        payload: Dict[str, Any],
        idempotency_key: Optional[str] = None
    ) -> BackgroundJob:
        """
        Enqueues an asynchronous task. If an idempotency_key is provided and
        already exists, returns the existing job to prevent duplicate side effects.
        """
        if idempotency_key:
            stmt = select(BackgroundJob).where(BackgroundJob.idempotency_key == idempotency_key)
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                logger.info(f"Duplicate job skipped for idempotency key: {idempotency_key}")
                return existing

        job = BackgroundJob(
            job_type=job_type,
            payload=payload,
            idempotency_key=idempotency_key,
            status=JobStatus.PENDING,
            attempts=0,
            max_attempts=3
        )
        db.add(job)
        await db.flush()
        return job

    @classmethod
    async def process_job(cls, db: AsyncSession, job: BackgroundJob) -> bool:
        """
        Executes a single background job with error containment and retries.
        """
        job.status = JobStatus.PROCESSING
        job.attempts += 1
        await db.commit()

        try:
            # Simulate secondary asynchronous work (notifications, metric indexing)
            if job.job_type == "NOTIFICATION":
                logger.info(f"[ASYNC] Notification sent for ticket {job.payload.get('work_item_id')}")
            elif job.job_type == "SLA_MONITOR":
                logger.info(f"[ASYNC] SLA clock initialized for ticket {job.payload.get('work_item_id')}")
            else:
                logger.info(f"[ASYNC] Processed task: {job.job_type}")

            job.status = JobStatus.COMPLETED
            job.processed_at = datetime.utcnow()
            await db.commit()
            return True

        except Exception as e:
            logger.error(f"[ASYNC] Job {job.id} failed on attempt {job.attempts}: {e}")
            job.last_error = str(e)
            if job.attempts >= job.max_attempts:
                job.status = JobStatus.FAILED  # Dead-lettered
            else:
                job.status = JobStatus.PENDING  # Eligible for retry
            await db.commit()
            return False

    @classmethod
    async def run_pending_jobs(cls, db: AsyncSession, limit: int = 10) -> int:
        """
        Pulls and processes the next batch of pending asynchronous tasks.
        """
        stmt = (
            select(BackgroundJob)
            .where(BackgroundJob.status == JobStatus.PENDING)
            .order_by(BackgroundJob.created_at.asc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        jobs = result.scalars().all()

        processed_count = 0
        for job in jobs:
            success = await cls.process_job(db, job)
            if success:
                processed_count += 1
        return processed_count
