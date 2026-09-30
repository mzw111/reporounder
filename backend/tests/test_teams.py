from app.models.sql_models import RoleEnum, TeamMembership, User


def test_create_team(client):
    response = client.post("/api/v1/teams", json={"name": "Platform"})

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Platform"
    assert body["members"][0]["role"] == "owner"


def test_get_my_teams_empty(client):
    response = client.get("/api/v1/teams/me")

    assert response.status_code == 200
    assert response.json() == []


def test_invite_member(client, db_session):
    team = client.post("/api/v1/teams", json={"name": "Platform"}).json()
    db_session.add(User(id="user-2", email="reviewer@example.com", hashed_password="x", display_name="Reviewer"))
    db_session.commit()

    response = client.post(
        f"/api/v1/teams/{team['id']}/invite",
        json={"email": "reviewer@example.com"},
    )

    assert response.status_code == 200
    assert response.json()["members"][-1]["role"] == "viewer"


def test_invite_duplicate(client, db_session):
    team = client.post("/api/v1/teams", json={"name": "Platform"}).json()
    db_session.add(User(id="user-2", email="reviewer@example.com", hashed_password="x", display_name="Reviewer"))
    db_session.commit()
    endpoint = f"/api/v1/teams/{team['id']}/invite"

    assert client.post(endpoint, json={"email": "reviewer@example.com"}).status_code == 200
    assert client.post(endpoint, json={"email": "reviewer@example.com"}).status_code == 400


def test_change_role(client, db_session):
    team = client.post("/api/v1/teams", json={"name": "Platform"}).json()
    member = User(id="user-2", email="reviewer@example.com", hashed_password="x", display_name="Reviewer")
    db_session.add(member)
    db_session.commit()
    client.post(f"/api/v1/teams/{team['id']}/invite", json={"email": member.email})

    response = client.put(
        f"/api/v1/teams/{team['id']}/members/{member.id}/role",
        json={"role": "reviewer"},
    )

    assert response.status_code == 200
    assert response.json()["members"][-1]["role"] == "reviewer"


def test_invite_requires_owner(client, db_session, test_user):
    team = client.post("/api/v1/teams", json={"name": "Platform"}).json()
    member = User(id="user-2", email="reviewer@example.com", hashed_password="x", display_name="Reviewer")
    db_session.add(member)
    db_session.commit()
    db_session.add(TeamMembership(user_id=member.id, team_id=team["id"], role=RoleEnum.reviewer))
    db_session.commit()

    from app.api.deps import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: member
    try:
        response = client.post(
            f"/api/v1/teams/{team['id']}/invite",
            json={"email": test_user.email},
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides[get_current_user] = lambda: test_user