import os
import sys
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Account, Transaction

class AdminAccountsAndReportsTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Admin user
        self.admin = User.query.filter_by(email='accounts_admin@example.com').first()
        if not self.admin:
            self.admin = User(name='Accounts Admin', email='accounts_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)
        else:
            self.admin.role = 'admin'
            self.admin.is_active = True

        # Normal User
        self.user = User.query.filter_by(email='accounts_user@example.com').first()
        if not self.user:
            self.user = User(name='Accounts User', email='accounts_user@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user)

        db.session.commit()

        # Add sample account & transaction for Accounts User
        acc = Account(user_id=self.user.id, name='Test HDFC Bank', type='Bank', current_balance=25000.0)
        tx = Transaction(user_id=self.user.id, amount=1500.0, type='expense', category='Food', description='Dinner', date='2026-08-11')
        db.session.add_all([acc, tx])
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

    def test_admin_list_accounts_endpoint(self):
        res = self.client.get('/api/admin/accounts', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('accounts', data)
        self.assertIn('total', data)
        self.assertGreaterEqual(data['total'], 1)

    def test_admin_list_transactions_endpoint(self):
        res = self.client.get('/api/admin/transactions?type=expense', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('transactions', data)
        self.assertIn('total', data)
        self.assertGreaterEqual(data['total'], 1)

    def test_admin_matplotlib_financial_report(self):
        res = self.client.get('/api/admin/reports/financial', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'image/png')

    def test_admin_report_with_query_param_token(self):
        res = self.client.get(f'/api/admin/reports/financial?token={self.admin_token}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'image/png')

    def test_admin_matplotlib_user_growth_report(self):
        res = self.client.get('/api/admin/reports/users', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'image/png')

    def test_admin_matplotlib_category_spending_report(self):
        res = self.client.get('/api/admin/reports/transactions', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'image/png')

    def test_unauthenticated_admin_report_rejected(self):
        res = self.client.get('/api/admin/reports/financial')
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data.get('message'), 'Authorization token is missing')

    def test_non_admin_report_access_rejected(self):
        res = self.client.get('/api/admin/reports/financial', headers={'Authorization': f'Bearer {self.user_token}'})
        self.assertEqual(res.status_code, 403)

    def test_unauthorized_non_admin_access_rejected(self):
        res = self.client.get('/api/admin/accounts', headers={'Authorization': f'Bearer {self.user_token}'})
        self.assertEqual(res.status_code, 403)

if __name__ == '__main__':
    unittest.main()
