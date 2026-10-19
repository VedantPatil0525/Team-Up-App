import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_illegal_state_transition_is_blocked(async_client: AsyncClient):
    """
    Asserts that an operator cannot jump directly from NEW to RESOLVED,
    bypassing the triage and investigation lifecycle stages.
    """
    # 1. Create a fresh ticket in NEW state
    create_resp = await async_client.post(
        "/api/v1/work-items",
        json={
            "title": "STATE MACHINE TEST: Unhandled Exception in Cron",
            "description": "Cron job failed with exit code 1.",
            "category": "INCIDENT",
            "priority": "P2_MEDIUM",
            "team_id": "team_engineering",
            "approval_required": False
        },
        headers={"X-User-Id": "usr_sam"}
    )
    item_id = create_resp.json()["id"]

    # 2. Attempt illegal transition directly from NEW to RESOLVED
    illegal_resp = await async_client.post(
        f"/api/v1/work-items/{item_id}/transition",
        json={"version": 1, "target_status": "RESOLVED"},
        headers={"X-User-Id": "usr_sam"}
    )

    # 3. Assert: Rejected with HTTP 422 Unprocessable Entity
    assert illegal_resp.status_code == 422
    assert "illegal transition" in illegal_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_gated_item_cannot_resolve_without_approval(async_client: AsyncClient):
    """
    Asserts that an item flagged with approval_required cannot be resolved
    by a standard operator without prior approval.
    """
    create_resp = await async_client.post(
        "/api/v1/work-items",
        json={
            "title": "STATE MACHINE TEST: Vendor Contract Termination",
            "description": "Requires legal sign-off before closure.",
            "category": "COMPLIANCE",
            "priority": "P1_HIGH",
            "team_id": "team_compliance",
            "approval_required": True
        },
        headers={"X-User-Id": "usr_morgan"}
    )
    item_id = create_resp.json()["id"]

    # Transition to IN_PROGRESS
    trans_resp = await async_client.post(
        f"/api/v1/work-items/{item_id}/transition",
        json={"version": 1, "target_status": "IN_PROGRESS"},
        headers={"X-User-Id": "usr_morgan"}
    )
    assert trans_resp.status_code == 200
    version = trans_resp.json()["version"]

    # Attempt to resolve without Team Lead approval
    # Taylor is an observer; Jordan is not on compliance team
    resolve_resp = await async_client.post(
        f"/api/v1/work-items/{item_id}/transition",
        json={"version": version, "target_status": "RESOLVED", "resolution_notes": "Attempting early closure"},
        headers={"X-User-Id": "usr_jordan"}
    )
    assert resolve_resp.status_code == 403
