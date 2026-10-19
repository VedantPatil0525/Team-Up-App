import asyncio
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_concurrent_claim_race_condition(async_client: AsyncClient):
    """
    Simulates two authorized operators (Alex and Jordan, both in Customer Support)
    attempting to claim an unassigned support ticket at the exact same millisecond.
    Verifies that atomic concurrency control ensures strictly one winner (200)
    and one collision error (409 Conflict).
    """
    # 1. Create a fresh unassigned operational ticket in team_support
    create_resp = await async_client.post(
        "/api/v1/work-items",
        json={
            "title": "CONCURRENCY TEST: VIP Enterprise Client Urgent Callback",
            "description": "Enterprise customer requesting immediate phone support for billing discrepancy.",
            "category": "CUSTOMER_ISSUE",
            "priority": "P1_HIGH",
            "team_id": "team_support",
            "approval_required": False
        },
        headers={"X-User-Id": "usr_alex"}
    )
    assert create_resp.status_code == 201
    item_id = create_resp.json()["id"]

    # 2. Fire two claim requests simultaneously via asyncio.gather
    # Both Alex (usr_alex) and Jordan (usr_jordan) are authorized members of team_support
    claim_alex = async_client.post(
        f"/api/v1/work-items/{item_id}/claim",
        json={"note": "Taking ticket - dialing customer now."},
        headers={"X-User-Id": "usr_alex"}
    )
    claim_jordan = async_client.post(
        f"/api/v1/work-items/{item_id}/claim",
        json={"note": "Taking ticket - reviewing account notes."},
        headers={"X-User-Id": "usr_jordan"}
    )

    responses = await asyncio.gather(claim_alex, claim_jordan)
    status_codes = [r.status_code for r in responses]

    # 3. Assertions: Exactly one winner (200 OK) and one conflict (409 Conflict)
    assert 200 in status_codes, f"One claim request must succeed, got {status_codes}"
    assert 409 in status_codes, f"The competing claim must be rejected with 409 Conflict, got {status_codes}"

    # Verify conflict payload detail
    conflict_resp = next(r for r in responses if r.status_code == 409)
    assert "collision" in conflict_resp.json()["detail"].lower()

    # 4. Verify database state: strictly one assignee
    verify_resp = await async_client.get(f"/api/v1/work-items/{item_id}")
    assert verify_resp.status_code == 200
    item = verify_resp.json()
    assert item["assignee_id"] in ["usr_alex", "usr_jordan"]
    assert item["status"] == "IN_PROGRESS"
    assert item["version"] == 2
