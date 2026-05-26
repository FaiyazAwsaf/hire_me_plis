"""
Auth endpoint tests: /auth/register, /auth/login, /auth/me, /auth/refresh
"""
import pytest
from httpx import AsyncClient

REGISTER = "/auth/register"
LOGIN = "/auth/login"
ME = "/auth/me"
REFRESH = "/auth/refresh"


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

class TestRegister:
    async def test_success_returns_201_with_token(self, client: AsyncClient):
        resp = await client.post(REGISTER, json={"email": "new@test.com", "password": "password123"})
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_response_contains_user_fields(self, client: AsyncClient):
        resp = await client.post(REGISTER, json={"email": "shape@test.com", "password": "password123"})
        user = resp.json()["user"]
        assert "id" in user
        assert user["email"] == "shape@test.com"
        assert "created_at" in user

    async def test_password_not_exposed_in_response(self, client: AsyncClient):
        resp = await client.post(REGISTER, json={"email": "safe@test.com", "password": "password123"})
        user = resp.json()["user"]
        assert "password" not in user
        assert "hashed_pw" not in user

    async def test_duplicate_email_returns_400(self, client: AsyncClient):
        body = {"email": "dup@test.com", "password": "password123"}
        await client.post(REGISTER, json=body)
        resp = await client.post(REGISTER, json=body)
        assert resp.status_code == 400
        assert resp.json()["detail"] == "Email already registered"

    async def test_password_too_short_returns_422(self, client: AsyncClient):
        resp = await client.post(REGISTER, json={"email": "short@test.com", "password": "abc"})
        assert resp.status_code == 422

    async def test_missing_email_returns_422(self, client: AsyncClient):
        resp = await client.post(REGISTER, json={"password": "password123"})
        assert resp.status_code == 422

    async def test_missing_password_returns_422(self, client: AsyncClient):
        resp = await client.post(REGISTER, json={"email": "nopw@test.com"})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class TestLogin:
    async def test_success_returns_200_with_token(self, client: AsyncClient, registered_user):
        resp = await client.post(LOGIN, json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == registered_user["email"]

    async def test_wrong_email_returns_401(self, client: AsyncClient):
        resp = await client.post(LOGIN, json={"email": "nobody@test.com", "password": "password123"})
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid credentials"

    async def test_wrong_password_returns_401(self, client: AsyncClient, registered_user):
        resp = await client.post(LOGIN, json={
            "email": registered_user["email"],
            "password": "wrongpassword",
        })
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid credentials"

    async def test_both_failure_modes_return_identical_error(self, client: AsyncClient, registered_user):
        # Security: must not reveal whether email or password was wrong.
        resp_bad_email = await client.post(LOGIN, json={"email": "nobody@test.com", "password": "password123"})
        resp_bad_pass = await client.post(LOGIN, json={
            "email": registered_user["email"],
            "password": "wrongpassword",
        })
        assert resp_bad_email.status_code == resp_bad_pass.status_code == 401
        assert resp_bad_email.json()["detail"] == resp_bad_pass.json()["detail"]


# ---------------------------------------------------------------------------
# Get current user (/me)
# ---------------------------------------------------------------------------

class TestGetMe:
    async def test_success_returns_user_profile(self, client: AsyncClient, registered_user):
        resp = await client.get(ME, headers={"Authorization": f"Bearer {registered_user['token']}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == registered_user["email"]
        assert data["id"] == registered_user["user"]["id"]
        assert "created_at" in data

    async def test_no_authorization_header_returns_401(self, client: AsyncClient):
        resp = await client.get(ME)
        assert resp.status_code == 401

    async def test_invalid_token_returns_401(self, client: AsyncClient):
        resp = await client.get(ME, headers={"Authorization": "Bearer not.a.real.token"})
        assert resp.status_code == 401

    async def test_wrong_scheme_returns_401(self, client: AsyncClient, registered_user):
        # OAuth2PasswordBearer only accepts "Bearer" scheme.
        resp = await client.get(ME, headers={"Authorization": f"Token {registered_user['token']}"})
        assert resp.status_code == 401

    async def test_me_returns_only_safe_fields(self, client: AsyncClient, registered_user):
        resp = await client.get(ME, headers={"Authorization": f"Bearer {registered_user['token']}"})
        data = resp.json()
        assert "hashed_pw" not in data
        assert "password" not in data
        assert set(data.keys()) == {"id", "email", "created_at"}


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

class TestRefresh:
    async def test_success_returns_new_token(self, client: AsyncClient, registered_user):
        resp = await client.post(REFRESH, json={"token": registered_user["token"]})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == registered_user["email"]

    async def test_refreshed_token_is_valid_for_me(self, client: AsyncClient, registered_user):
        refresh_resp = await client.post(REFRESH, json={"token": registered_user["token"]})
        new_token = refresh_resp.json()["access_token"]
        me_resp = await client.get(ME, headers={"Authorization": f"Bearer {new_token}"})
        assert me_resp.status_code == 200

    async def test_invalid_token_returns_401(self, client: AsyncClient):
        resp = await client.post(REFRESH, json={"token": "not.a.real.token"})
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid or expired token"

    async def test_missing_token_field_returns_422(self, client: AsyncClient):
        resp = await client.post(REFRESH, json={})
        assert resp.status_code == 422
