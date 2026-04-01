import unittest

import bcrypt

import app as app_module
from app import app, db, ensure_post_status_column
from models import Post


class StatusVisibilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        app.config["JWT_SECRET_KEY"] = "test-secret"
        app_module.ADMIN_PASSWORD_HASH = bcrypt.hashpw(b"test-pass", bcrypt.gensalt())
        app_module.ADMIN_USERNAME = "h_xiaozhi"
        cls.client = app.test_client()

    def setUp(self):
        with app.app_context():
            db.drop_all()
            db.create_all()
            ensure_post_status_column()
            db.session.add(Post(title="pub", content="published body", status="published"))
            db.session.add(Post(title="draft", content="draft body", status="draft"))
            db.session.add(Post(title="arch", content="archived body", status="archived"))
            db.session.commit()

    def login_and_get_headers(self):
        response = self.client.post(
            "/api/auth/login",
            json={"username": "h_xiaozhi", "password": "test-pass"},
        )
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    def test_anonymous_list_only_shows_published(self):
        response = self.client.get("/api/posts")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["items"][0]["status"], "published")

    def test_anonymous_cannot_open_draft_detail(self):
        response = self.client.get("/api/posts/2")
        self.assertEqual(response.status_code, 404)

    def test_logged_in_can_filter_draft(self):
        headers = self.login_and_get_headers()
        response = self.client.get("/api/posts?status=draft", headers=headers)
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["items"][0]["status"], "draft")


if __name__ == "__main__":
    unittest.main()
