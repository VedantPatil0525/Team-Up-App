import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def sync_indian_personas_and_clear_demo_items():
    """
    1. Updates seed personas to Indian names (Aarav, Rohan, Ananya, Samir, Pooja, Priya).
    2. Clears demo work items so dashboard begins completely clean.
    """
    async with AsyncSessionLocal() as session:
        try:
            # 1. Update Persona Names & Emails
            updates = [
                ("usr_alex", "Aarav Sharma", "aarav.sharma@teamup.internal"),
                ("usr_jordan", "Rohan Mehta", "rohan.mehta@teamup.internal"),
                ("usr_morgan", "Ananya Iyer", "ananya.iyer@teamup.internal"),
                ("usr_sam", "Samir Patel", "samir.patel@teamup.internal"),
                ("usr_taylor", "Pooja Verma", "pooja.verma@teamup.internal"),
                ("usr_elena", "Priya Nair (Admin)", "priya.nair@teamup.internal"),
            ]
            for user_id, name, email in updates:
                await session.execute(
                    text("UPDATE users SET name = :name, email = :email WHERE id = :id"),
                    {"name": name, "email": email, "id": user_id}
                )

            # 2. Clear all pre-seeded demo work items & their audit trails so the dashboard starts completely clean
            await session.execute(text("DELETE FROM audit_events"))
            await session.execute(text("DELETE FROM work_items"))

            await session.commit()
            print("[Team-Up DB] Successfully updated personas to Indian names and cleared all demo work items.")
        except Exception as e:
            await session.rollback()
            print(f"[Team-Up DB] Error updating personas and demo items: {e}")

if __name__ == "__main__":
    asyncio.run(sync_indian_personas_and_clear_demo_items())
