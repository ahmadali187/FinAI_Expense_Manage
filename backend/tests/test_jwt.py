import unittest
import os
import sys
import jwt
import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Ensure JWT_SECRET is set for testing
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User

class TestJWTAuthentication(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Create test user
        self.user = User.query.filter_by(email='test_jwt_user@example.com').first()
        if not self.user:
            self.user = User(
                name='Test JWT User',
                email='test_jwt_user@example.com',
                password_hash='pass123',
                auth_provider='email'
            )
            db.session.add(self.user)
            db.session.commit()

        # Generate valid token
        payload = {
            'user_id': self.user.id,
            'email': self.user.email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }
        self.valid_token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

    def tearDown(self):
        self.app_context.pop()

    def test_valid_jwt_access(self):
        response = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {self.valid_token}'})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['user']['email'], self.user.email)

    def test_missing_jwt_access(self):
        response = self.client.get('/api/auth/me')
        self.assertEqual(response.status_code, 401)

    def test_invalid_jwt_access(self):
        response = self.client.get('/api/auth/me', headers={'Authorization': 'Bearer invalid.token.value'})
        self.assertEqual(response.status_code, 401)

    def test_expired_jwt_access(self):
        expired_payload = {
            'user_id': self.user.id,
            'email': self.user.email,
            'exp': datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        }
        expired_token = jwt.encode(expired_payload, app.config['SECRET_KEY'], algorithm='HS256')
        response = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {expired_token}'})
        self.assertEqual(response.status_code, 401)

    def test_tampered_jwt_signature(self):
        wrong_secret_token = jwt.encode(
            {'user_id': self.user.id, 'email': self.user.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            'wrong_secret_key_123',
            algorithm='HS256'
        )
        response = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {wrong_secret_token}'})
        self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    unittest.main()
