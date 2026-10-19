import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_observer_cannot_claim_item(async_client: AsyncClient):
    """
    Taylor Brooks (usr_taylor) is an OBSERVER in Payments.
    Asserts that attempting to claim or mutate an item fails with HTTP 403 Forbidden.
    """
    # 1. Create a Payments ticket
    create_resp = await async_client.post(
        "/api/v1/work-items",
        json={
            "title": "RBAC TEST: Chargeback Dispute Review",
            "description": "Customer dispute regarding chargeback fee.",
            "category": "PAYMENT_REVIEW",
            "priority": "P2_MEDIUM",
            "team_id": "team_payments",
            "approval_required": False
        },
        headers={"X-User-Id": "usr_alex"}
    )
    assert create_resp.status_code == 201
    item_id = create_resp.json()["id"]

    # 2. Taylor (Observer) attempts to claim the item
    claim_resp = await async_client.post(
        f"/api/v1/work-items/{item_id}/claim",
        headers={"X-User-Id": "usr_taylor"}  # Taylor has OBSERVER role
    )

    # 3. Assert: Must be rejected with HTTP 403 Forbidden
    assert claim_resp.status_code == 403
    assert "observer" in claim_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_regular_member_cannot_grant_lead_approval(async_client: AsyncClient):
    """
    Verifies that a standard Member cannot bypass approval gating.
    Only a designated Team Lead can approve or reject gated requests.
    """
    # 1. Create an item requiring approval in Payments
    create_resp = await async_client.post(
        "/api/v1/work-items",
        json={
            "title": "RBAC TEST: $50,000 Payout Authorization",
            "description": "High value wire transfer pending approval.",
            "category": "PAYMENT_REVIEW",
            "priority": "P1_HIGH",
            "team_id": "team_payments",
            "approval_required": True
        },
        headers={"X-User-Id": "usr_alex"}
    )
    item_id = create_resp.json()["id"]

    # Transition item to PENDING_APPROVAL
    trans_resp = await async_client.post(
        f"/api/v1/work-items/{item_id}/transition",
        json={"version": 1, "target_status": "PENDING_APPROVAL"},
        headers={"X-User-Id": "usr_alex"}
    )
    assert trans_resp.status_code == 200
    version = trans_resp.json()["version"]

    # 2. Jordan Chen (usr_jordan - regular Member, not Payments Lead) attempts to approve
    unauth_approval = await async_client.post(
        f"/api/v1/work-items/{item_id}/approve",
        json={"version": version, "approved": True, "reason": "Self-approval attempt"},
        headers={"X-User-Id": "usr_jordan"}
    )
    assert unauth_approval.status_code == 403
    assert "team_lead" in unauth_approval.json()["detail"].lower()

    # 3. Alex Rivera (usr_alex - authorized Payments Lead) approves the item
    auth_approval = await async_client.post(
        f"/api/v1/work-items/{item_id}/approve",
        json={"version": version, "approved": True, "reason": "Authorized after ledger review."},
        headers={"X-User-Id": "usr_alex"}
    )
    assert auth_approval.status_code == 200
    approved_item = auth_approval.json()
    assert approved_item["approved_by_id"] == "usr_alex"
    assert approved_item["status"] == "IN_PROGRESS"
