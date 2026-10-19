from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditEvent, AuditActionType


class AuditService:
    @staticmethod
    async def record_event(
        db: AsyncSession,
        work_item_id: str,
        actor_id: str,
        action_type: AuditActionType,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        context_note: Optional[str] = None
    ) -> AuditEvent:
        """
        Creates an immutable audit record capturing the actor, action,
        field diffs, and context notes in the current database transaction.
        """
        event = AuditEvent(
            work_item_id=work_item_id,
            actor_id=actor_id,
            action_type=action_type,
            old_values=old_values,
            new_values=new_values,
            context_note=context_note
        )
        db.add(event)
        # Flush so the event ID is generated within the active transaction
        await db.flush()
        return event
