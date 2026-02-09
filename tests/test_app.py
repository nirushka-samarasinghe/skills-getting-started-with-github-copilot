import copy
import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


ORIGINAL = copy.deepcopy(activities)


def reset_activities():
    activities.clear()
    activities.update(copy.deepcopy(ORIGINAL))


@pytest.fixture(autouse=True)
def restore_activities():
    # reset before each test
    reset_activities()
    yield
    reset_activities()


def test_get_activities():
    client = TestClient(app)
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    client = TestClient(app)
    activity = "Chess Club"
    email = "test_student@example.com"

    # ensure not present
    res = client.get("/activities")
    assert email not in res.json()[activity]["participants"]

    # sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")

    # verify present
    res = client.get("/activities")
    assert email in res.json()[activity]["participants"]

    # unregister
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert "Unregistered" in res.json().get("message", "")

    # verify removed
    res = client.get("/activities")
    assert email not in res.json()[activity]["participants"]
