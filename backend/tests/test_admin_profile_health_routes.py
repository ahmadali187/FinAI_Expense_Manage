import os
import sys
import unittest
import jwt
import datetime
from werkzeug.security import check_password_hash, generate_password_hash

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User

class AdminProfileHealthRoutesTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Admin user for testing password changes
        self.admin = User.query.filter_by(email='pass_admin@example.com').first()
        if not self.admin:
            self.admin = User(name='Password Admin', email='pass_admin@example.com', password_hash=generate_password_hash('old_pass123'), role='admin', is_active=True)
            db.session.add(self.admin)
        else:
            self.admin.password_hash = generate_password_hash('old_pass123')
            self.admin.role = 'admin'
            self.admin.is_active = True

        # Normal User
        self.user = User.query.filter_by(email='pass_user@example.com').first()
        if not self.user:
            self.user = User(name='Password User', email='pass_user@example.com', password_hash=generate_password_hash('pass123'), role='user', is_active=True)
            db.session.add(self.user)

        db.session.commit()

        self.admin_token = jwt.encode(
            {'user_id': self.admin.id, 'email': self.admin.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'], algorithm='HS256'
        )

        self.user_token = jwt.encode(
            {'user_id': self.user.id, 'email': self.user.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'], algorithm='HS256'
        )

    def tearDown(self):
        self.app_context.pop()

    def test_change_password_validation(self):
        # 1. Missing fields
        res1 = self.client.post('/api/admin/change-password', json={}, headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res1.status_code, 400)

        # 2. Too short new password
        res2 = self.client.post('/api/admin/change-password', json={'current_password': 'old_pass123', 'new_password': '123'}, headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res2.status_code, 400)

        # 3. Incorrect current password
        res3 = self.client.post('/api/admin/change-password', json={'current_password': 'wrong_password', 'new_password': 'new_secure_pass123'}, headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res3.status_code, 400)

    def test_change_password_success(self):
        # Successful password update
        res = self.client.post('/api/admin/change-password', json={'current_password': 'old_pass123', 'new_password': 'new_secure_pass123'}, headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json().get('success'))

        # Verify password hash updated in SQLite
        updated_admin = db.session.get(User, self.admin.id)
        self.assertTrue(check_password_hash(updated_admin.password_hash, 'new_secure_pass123'))

    def test_system_health_endpoint(self):
        res = self.client.get('/api/admin/system-health', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('database', data)
        self.assertEqual(data['status'], 'healthy')

    def test_unauthorized_change_password(self):
        # Normal user access denied
        res = self.client.post('/api/admin/change-password', json={'current_password': 'pass123', 'new_password': 'newpass123'}, headers={'Authorization': f'Bearer {self.user_token}'})
        self.assertEqual(res.status_code, 403)

if __name__ == '__main__':
    unittest.main()
