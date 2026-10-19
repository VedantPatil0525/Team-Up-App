import pytest
import httpx
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import User


@pytest.mark.asyncio
async def test_google_auth_invalid_token(db_session):
    """
    Verifies that providing an invalid or expired Google ID token
    is rejected with HTTP 401 Unauthorized.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Mock Google tokeninfo returning 400 Bad Request
        mock_response = AsyncMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {"error_description": "Invalid Value"}

        with patch("httpx.AsyncClient.get", return_value=mock_response):
            res = await client.post(
                "/api/v1/auth/google",
                json={"id_token": "invalid_fake_google_jwt_token"}
            )
            assert res.status_code == 401
            assert "Invalid, expired, or untrusted Google OAuth token" in res.json()["detail"]


@pytest.mark.asyncio
async def test_google_auth_success_provisioning(db_session):
    """
    Verifies that a valid Google OAuth ID token provisions a new employee
    and attaches them to their department team in PostgreSQL.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Fetch available teams to pick a target team
        teams_res = await client.get("/api/v1/teams")
        assert teams_res.status_code == 200
        teams = teams_res.json()
        target_team = teams[0]

        unique_email = f"google.oauth.test.{target_team['id'][:6]}@company.com"

        # Mock Google tokeninfo returning verified Google OAuth payload
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "iss": "https://accounts.google.com",
            "sub": "109876543210987654321",
            "email": unique_email,
            "email_verified": "true",
            "name": "Google Verified User",
            "picture": "https://lh3.googleusercontent.com/a-/test-photo",
        }

        with patch("httpx.AsyncClient.get", return_value=mock_response):
            auth_res = await client.post(
                "/api/v1/auth/google",
                json={
                    "id_token": "valid_mock_jwt_credential",
                    "team_id": target_team["id"]
                }
            )
            assert auth_res.status_code == 200
            user_data = auth_res.json()
            assert user_data["email"] == unique_email
            assert user_data["name"] == "Google Verified User"
            assert user_data["avatar_url"] == "https://lh3.googleusercontent.com/a-/test-photo"
            assert any(t["team_id"] == target_team["id"] for t in user_data["teams"])
