import os
import sys
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Transaction

class AdminSecurityTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Admin user
        self.admin = User.query.filter_by(email='admin_test@example.com').first()
        if not self.admin:
            self.admin = User(name='Admin Test', email='admin_test@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)

        # Normal User 1
        self.user1 = User.query.filter_by(email='normal1_test@example.com').first()
        if not self.user1:
            self.user1 = User(name='Normal One', email='normal1_test@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user1)

        # Normal User 2
        self.user2 = User.query.filter_by(email='normal2_test@example.com').first()
        if not self.user2:
            self.user2 = User(name='Normal Two', email='normal2_test@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user2)

        db.session.commit()

        # Add sample transaction for User 1
        tx1 = Transaction(user_id=self.user1.id, amount=100.0, category='Food', date='2026-08-11', description='User 1 Expense')
        # Add sample transaction for User 2
        tx2 = Transaction(user_id=self.user2.id, amount=200.0, category='Transport', date='2026-08-11', description='User 2 Expense')
        db.session.add_all([tx1, tx2])
        db.session.commit()

        self.admin_token = jwt.encode(
            {'user_id': self.admin.id, 'email': self.admin.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'], algorithm='HS256'
        )

        self.user1_token = jwt.encode(
            {'user_id': self.user1.id, 'email': self.user1.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'], algorithm='HS256'
        )

        self.user2_token = jwt.encode(
            {'user_id': self.user2.id, 'email': self.user2.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'], algorithm='HS256'
        )

    def tearDown(self):
        self.app_context.pop()

    def test_unauthenticated_admin_access_rejected(self):
        res = self.client.get('/api/admin/users')
        self.assertEqual(res.status_code, 401)

    def test_normal_user_admin_access_forbidden(self):
        res = self.client.get('/api/admin/users', headers={'Authorization': f'Bearer {self.user1_token}'})
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertIn('Access denied', data['message'])

    def test_admin_access_granted(self):
        res = self.client.get('/api/admin/users', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(isinstance(data, list) or (isinstance(data, dict) and 'users' in data))

    def test_database_health_check(self):
        res = self.client.get('/api/admin/database-health', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertTrue(data['required_tables_present'])

    def test_database_summary(self):
        res = self.client.get('/api/admin/database-summary', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('users', data)
        self.assertIn('transactions', data)

    def test_admin_database_backup(self):
        res = self.client.post('/api/admin/backup-db', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])

    def test_user_deactivation_blocks_access(self):
        # Admin deactivates User 2
        res = self.client.put(
            f'/api/admin/users/{self.user2.id}/status',
            json={'is_active': False},
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        self.assertEqual(res.status_code, 200)

        # Deactivated User 2 attempts API call -> HTTP 403
        res2 = self.client.get('/api/transactions', headers={'Authorization': f'Bearer {self.user2_token}'})
        self.assertEqual(res2.status_code, 403)

        # Reactivate User 2
        self.client.put(
            f'/api/admin/users/{self.user2.id}/status',
            json={'is_active': True},
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )

    def test_admin_get_user_details(self):
        res = self.client.get(f'/api/admin/users/{self.user1.id}', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('user', data)
        self.assertIn('summary', data)
        self.assertIn('transactions', data)
        self.assertEqual(data['user']['id'], self.user1.id)

    def test_admin_analytics(self):
        res = self.client.get('/api/admin/analytics?period=30days', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('user_growth', data)
        self.assertIn('top_categories', data)
        self.assertIn('top_spending_users', data)

    def test_admin_table_inspection_redacts_sensitive_keys(self):
        res = self.client.get('/api/admin/tables/users', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['table_name'], 'users')
        self.assertIn('recent_records', data)
        if data['recent_records']:
            first_rec = data['recent_records'][0]
            if 'password_hash' in first_rec:
                self.assertEqual(first_rec['password_hash'], '[REDACTED]')

if __name__ == '__main__':
    unittest.main()
