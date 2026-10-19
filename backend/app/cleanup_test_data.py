import asyncio
from sqlalchemy import select, delete, or_
from app.database import AsyncSessionLocal
from app.models.work_item import WorkItem
from app.models.audit import AuditEvent


async def cleanup_test_records():
    print("[Team-Up Cleanup] Removing test-generated items from database...")
    async with AsyncSessionLocal() as session:
        # Find all test work items
        stmt = select(WorkItem.id).where(
            or_(
                WorkItem.title.ilike("%TEST:%"),
                WorkItem.title.ilike("%CONCURRENCY TEST%"),
                WorkItem.title.ilike("%OCC TEST%"),
                WorkItem.title.ilike("%STATE MACHINE TEST%"),
                WorkItem.title.ilike("%RBAC TEST%")
            )
        )
        res = await session.execute(stmt)
        test_ids = res.scalars().all()

        if test_ids:
            # Delete associated audit events and comments first
            await session.execute(delete(AuditEvent).where(AuditEvent.work_item_id.in_(test_ids)))
            # Delete test work items
            await session.execute(delete(WorkItem).where(WorkItem.id.in_(test_ids)))
            await session.commit()
            print(f"[Team-Up Cleanup] Successfully removed {len(test_ids)} test items. Database is now pristine!")
        else:
            print("[Team-Up Cleanup] No test items found. Database is already clean.")


if __name__ == "__main__":
    asyncio.run(cleanup_test_records())
