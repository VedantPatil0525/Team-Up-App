import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_optimistic_concurrency_control_conflict(async_client: AsyncClient):
    """
    Verifies that submitting an update with a stale version is rejected with HTTP 409
    and returns a structured conflict payload to prevent mid-air collisions.
    """
    # 1. Create a work item (initial version = 1)
    create_resp = await async_client.post(
        "/api/v1/work-items",
        json={
            "title": "OCC TEST: Settlement Batch Desync",
            "description": "Daily settlement batch desynchronized between database and ledger.",
            "category": "PAYMENT_REVIEW",
            "priority": "P2_MEDIUM",
            "team_id": "team_payments",
            "approval_required": True
        },
        headers={"X-User-Id": "usr_alex"}
    )
    assert create_resp.status_code == 201
    item = create_resp.json()
    item_id = item["id"]
    initial_version = item["version"]
    assert initial_version == 1

    # 2. User A successfully updates the item (version bumps to 2)
    update_a_resp = await async_client.patch(
        f"/api/v1/work-items/{item_id}",
        json={
            "version": 1,
            "title": "OCC TEST: Settlement Batch Desync (Escalated to P1)",
            "priority": "P1_HIGH",
            "edit_reason": "Escalated priority due to upcoming cutoff time."
        },
        headers={"X-User-Id": "usr_alex"}
    )
    assert update_a_resp.status_code == 200
    updated_item = update_a_resp.json()
    assert updated_item["version"] == 2
    assert updated_item["priority"] == "P1_HIGH"

    # 3. User B attempts to submit an edit using the STALE version 1
    update_b_resp = await async_client.patch(
        f"/api/v1/work-items/{item_id}",
        json={
            "version": 1,  # Stale version!
            "title": "OCC TEST: Overwritten Title by User B",
            "description": "User B description attempting to clobber User A.",
            "edit_reason": "Late edit."
        },
        headers={"X-User-Id": "usr_alex"}
    )

    # 4. Assert: Must be rejected with HTTP 409 Conflict
    assert update_b_resp.status_code == 409
    conflict_data = update_b_resp.json()["detail"]
    assert conflict_data["client_version"] == 1
    assert conflict_data["server_version"] == 2
    assert "mid-air collision" in conflict_data["message"].lower()

    # 5. Verify database integrity: User A's changes are still intact!
    get_resp = await async_client.get(f"/api/v1/work-items/{item_id}")
    assert get_resp.status_code == 200
    final_item = get_resp.json()
    assert final_item["priority"] == "P1_HIGH"
    assert "Escalated to P1" in final_item["title"]
