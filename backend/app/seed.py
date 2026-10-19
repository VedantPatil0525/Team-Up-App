import asyncio
from datetime import datetime
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models.user import User, SystemRole
from app.models.team import Team, TeamMember, TeamRole
from app.models.work_item import (
    WorkItem,
    WorkItemCategory,
    WorkItemPriority,
    WorkItemStatus,
)
from app.models.audit import AuditEvent, AuditActionType


async def seed_database():
    print("[Team-Up Seeder] Ensuring tables exist...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        existing_users = await session.execute(select(User).limit(1))
        if existing_users.scalar_one_or_none():
            print("[Team-Up Seeder] Database already contains records. Skipping seed.")
            return

        print("[Team-Up Seeder] Seeding teams...")
        teams_data = [
            Team(id="team_payments", name="Payments & Fraud", slug="payments", description="Investigates high-risk transactions, chargebacks, and payment processing anomalies."),
            Team(id="team_engineering", name="Engineering & Infrastructure", slug="engineering", description="Handles production incidents, system bugs, and latency degradations."),
            Team(id="team_compliance", name="Compliance & Regulatory", slug="compliance", description="Oversees GDPR audits, policy compliance, and regulatory approvals."),
            Team(id="team_support", name="Customer Experience", slug="support", description="First-line resolution for customer escalations and account inquiries."),
            Team(id="team_ops", name="Operations", slug="operations", description="Cross-functional operational workflows and internal tooling coordination."),
        ]
        session.add_all(teams_data)
        await session.flush()

        print("[Team-Up Seeder] Seeding employee personas...")
        users_data = [
            User(id="usr_alex", name="Aarav Sharma", email="aarav.sharma@teamup.internal", avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", system_role=SystemRole.MEMBER),
            User(id="usr_jordan", name="Rohan Mehta", email="rohan.mehta@teamup.internal", avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", system_role=SystemRole.MEMBER),
            User(id="usr_morgan", name="Ananya Iyer", email="ananya.iyer@teamup.internal", avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop", system_role=SystemRole.MEMBER),
            User(id="usr_sam", name="Samir Patel", email="samir.patel@teamup.internal", avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", system_role=SystemRole.MEMBER),
            User(id="usr_taylor", name="Pooja Verma", email="pooja.verma@teamup.internal", avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", system_role=SystemRole.MEMBER),
            User(id="usr_elena", name="Priya Nair (Admin)", email="priya.nair@teamup.internal", avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop", system_role=SystemRole.ADMIN),
        ]
        session.add_all(users_data)
        await session.flush()

        print("[Team-Up Seeder] Establishing team memberships & scoped roles...")
        memberships_data = [
            # Alex: Lead in Payments (can approve!), Member in Support
            TeamMember(id="tm_1", team_id="team_payments", user_id="usr_alex", team_role=TeamRole.LEAD),
            TeamMember(id="tm_2", team_id="team_support", user_id="usr_alex", team_role=TeamRole.MEMBER),

            # Jordan: Member in Support & Operations (Standard Operator)
            TeamMember(id="tm_3", team_id="team_support", user_id="usr_jordan", team_role=TeamRole.MEMBER),
            TeamMember(id="tm_4", team_id="team_ops", user_id="usr_jordan", team_role=TeamRole.MEMBER),

            # Morgan: Lead in Compliance
            TeamMember(id="tm_5", team_id="team_compliance", user_id="usr_morgan", team_role=TeamRole.LEAD),

            # Sam: Lead in Engineering
            TeamMember(id="tm_6", team_id="team_engineering", user_id="usr_sam", team_role=TeamRole.LEAD),

            # Taylor: Observer in Engineering & Payments (Read-Only)
            TeamMember(id="tm_7", team_id="team_engineering", user_id="usr_taylor", team_role=TeamRole.OBSERVER),
            TeamMember(id="tm_8", team_id="team_payments", user_id="usr_taylor", team_role=TeamRole.OBSERVER),

            # Elena: Admin in Operations
            TeamMember(id="tm_9", team_id="team_ops", user_id="usr_elena", team_role=TeamRole.LEAD),
        ]
        session.add_all(memberships_data)
        await session.flush()

        print("[Team-Up Seeder] Creating initial operational work items...")
        now = datetime.utcnow()
        items_data = [
            WorkItem(
                id="item_p0_outage",
                title="P0 INCIDENT: Stripe Webhook Latency Spike on EU Gateway",
                description="Elevated latency (>15s) and timeout errors detected on incoming EU payment webhook ingestion queue. 450 transactions currently queued.",
                category=WorkItemCategory.INCIDENT,
                priority=WorkItemPriority.P0_CRITICAL,
                status=WorkItemStatus.IN_PROGRESS,
                team_id="team_engineering",
                assignee_id="usr_sam",
                reporter_id="usr_alex",
                approval_required=False,
                version=2,
                created_at=now,
                updated_at=now
            ),
            WorkItem(
                id="item_fraud_review",
                title="High-Value Wire Transfer Authorization (Flagged by Fraud Engine)",
                description="Transaction ID #TX-90214 ($84,200) triggered velocity anomaly rules. Requires Payments Lead manual review and sign-off before settlement release.",
                category=WorkItemCategory.PAYMENT_REVIEW,
                priority=WorkItemPriority.P1_HIGH,
                status=WorkItemStatus.PENDING_APPROVAL,
                team_id="team_payments",
                assignee_id="usr_alex",
                reporter_id="usr_jordan",
                approval_required=True,
                version=3,
                created_at=now,
                updated_at=now
            ),
            WorkItem(
                id="item_gdpr_audit",
                title="Q4 GDPR Right-to-be-Forgotten Data Erasure Sign-Off",
                description="Customer erasure request #CR-441 verified by compliance automation. Final regulatory approval required by Compliance Lead.",
                category=WorkItemCategory.COMPLIANCE,
                priority=WorkItemPriority.P1_HIGH,
                status=WorkItemStatus.PENDING_APPROVAL,
                team_id="team_compliance",
                assignee_id="usr_morgan",
                reporter_id="usr_elena",
                approval_required=True,
                version=1,
                created_at=now,
                updated_at=now
            ),
            WorkItem(
                id="item_unassigned_1",
                title="Enterprise Client Alpha: Dedicated IP Allocation Request",
                description="Client requested custom outbound NAT IP pool for whitelisting. Needs network engineer assignment and PTR record setup.",
                category=WorkItemCategory.OPERATIONAL_TASK,
                priority=WorkItemPriority.P2_MEDIUM,
                status=WorkItemStatus.NEW,
                team_id="team_engineering",
                assignee_id=None,  # Unassigned - available for claim race test
                reporter_id="usr_jordan",
                approval_required=False,
                version=1,
                created_at=now,
                updated_at=now
            ),
            WorkItem(
                id="item_unassigned_2",
                title="Customer Escalation: Duplicate Monthly Subscription Charge",
                description="Customer states their credit card was debited twice on Oct 1st. Needs verification in billing portal and partial refund authorization.",
                category=WorkItemCategory.CUSTOMER_ISSUE,
                priority=WorkItemPriority.P2_MEDIUM,
                status=WorkItemStatus.NEW,
                team_id="team_support",
                assignee_id=None,  # Unassigned - available for claim race test
                reporter_id="usr_alex",
                approval_required=False,
                version=1,
                created_at=now,
                updated_at=now
            )
        ]
        session.add_all(items_data)
        await session.flush()

        # Seed audit records for the items
        audit_records = [
            AuditEvent(
                id="aud_1",
                work_item_id="item_p0_outage",
                actor_id="usr_alex",
                action_type=AuditActionType.CREATED,
                old_values=None,
                new_values={"status": "NEW", "priority": "P0_CRITICAL"},
                context_note="Incident automatically reported from Datadog alert.",
                created_at=now
            ),
            AuditEvent(
                id="aud_2",
                work_item_id="item_p0_outage",
                actor_id="usr_sam",
                action_type=AuditActionType.CLAIMED,
                old_values={"assignee_id": None, "status": "NEW"},
                new_values={"assignee_id": "usr_sam", "status": "IN_PROGRESS"},
                context_note="Claimed incident lead. Rolling back latest EU worker deployment.",
                created_at=now
            ),
            AuditEvent(
                id="aud_3",
                work_item_id="item_fraud_review",
                actor_id="usr_jordan",
                action_type=AuditActionType.CREATED,
                new_values={"status": "NEW", "category": "PAYMENT_REVIEW"},
                context_note="Flagged transaction submitted for review.",
                created_at=now
            ),
            AuditEvent(
                id="aud_4",
                work_item_id="item_fraud_review",
                actor_id="usr_alex",
                action_type=AuditActionType.STATUS_CHANGED,
                old_values={"status": "NEW"},
                new_values={"status": "PENDING_APPROVAL"},
                context_note="Customer ID verification verified. Awaiting Lead sign-off.",
                created_at=now
            ),
        ]
        session.add_all(audit_records)
        await session.commit()
        print("[Team-Up Seeder] Database successfully populated with realistic operational data!")


if __name__ == "__main__":
    asyncio.run(seed_database())
