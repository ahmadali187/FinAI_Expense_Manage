import unittest
import json
import jwt
import datetime
from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Account, Transaction

class MasterProductionRepairTestSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Clean up existing test users if any
        User.query.filter(User.email.in_(['master_a@finai.com', 'master_b@finai.com'])).delete(synchronize_session=False)
        db.session.commit()

        # Create Test User A
        self.user_a = User(
            email='master_a@finai.com',
            name='Master User A',
            password_hash=generate_password_hash('Password123!'),
            role='user'
        )
        db.session.add(self.user_a)

        # Create Test User B
        self.user_b = User(
            email='master_b@finai.com',
            name='Master User B',
            password_hash=generate_password_hash('Password123!'),
            role='user'
        )
        db.session.add(self.user_b)
        db.session.commit()

        # Generate Tokens
        secret = self.app.config.get('SECRET_KEY', 'default_secret')
        self.token_a = jwt.encode({'user_id': self.user_a.id, 'email': self.user_a.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, secret, algorithm='HS256')
        self.token_b = jwt.encode({'user_id': self.user_b.id, 'email': self.user_b.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, secret, algorithm='HS256')

    def tearDown(self):
        Transaction.query.filter_by(user_id=self.user_a.id).delete(synchronize_session=False)
        Transaction.query.filter_by(user_id=self.user_b.id).delete(synchronize_session=False)
        Account.query.filter_by(user_id=self.user_a.id).delete(synchronize_session=False)
        Account.query.filter_by(user_id=self.user_b.id).delete(synchronize_session=False)
        User.query.filter(User.email.in_(['master_a@finai.com', 'master_b@finai.com'])).delete(synchronize_session=False)
        db.session.commit()
        self.app_context.pop()

    def test_01_new_user_without_account_returns_empty_list(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        res = self.client.get('/api/accounts', headers=headers_a)
        accs = json.loads(res.data)
        self.assertEqual(len(accs), 0)

    def test_02_add_account_then_transaction(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        # 1. Add Account
        res_acc = self.client.post('/api/accounts', json={
            'name': 'Master HDFC',
            'type': 'Bank Account',
            'opening_balance': 10000.0,
            'color': '#4f46e5'
        }, headers=headers_a)
        self.assertIn(res_acc.status_code, [200, 201])
        acc_id = json.loads(res_acc.data)['id']

        # 2. Add Expense
        res_tx = self.client.post('/api/transactions', json={
            'amount': 500.0,
            'type': 'expense',
            'category': 'Food',
            'account_id': acc_id,
            'date': '2026-08-18',
            'description': 'Dinner'
        }, headers=headers_a)
        self.assertEqual(res_tx.status_code, 200)

        # 3. Verify Account Balance is ₹9,500
        res_accs_get = self.client.get('/api/accounts', headers=headers_a)
        accs_data = json.loads(res_accs_get.data)
        self.assertEqual(accs_data[0]['current_balance'], 9500.0)
        self.assertEqual(accs_data[0]['transaction_count'], 1)

    def test_03_transaction_updates_dashboard_and_reports(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        res_acc = self.client.post('/api/accounts', json={'name': 'Main Bank', 'type': 'Bank Account', 'opening_balance': 20000.0}, headers=headers_a)
        acc_id = json.loads(res_acc.data)['id']

        self.client.post('/api/transactions', json={'amount': 300.0, 'type': 'expense', 'category': 'Transport', 'account_id': acc_id, 'date': '2026-08-18'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 15000.0, 'type': 'income', 'category': 'Salary', 'account_id': acc_id, 'date': '2026-08-18'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 5000.0, 'type': 'income', 'category': 'Business', 'account_id': acc_id, 'date': '2026-08-18'}, headers=headers_a)

        # Verify Dashboard
        res_dash = self.client.get('/api/dashboard', headers=headers_a)
        dash_data = json.loads(res_dash.data)
        self.assertEqual(len(dash_data['transactions']), 3)

        # Verify Reports
        res_rep = self.client.get('/api/reports/generate?from_date=2026-08-01&to_date=2026-08-31', headers=headers_a)
        rep_summary = json.loads(res_rep.data)['summary']
        self.assertEqual(rep_summary['total_income'], 20000.0)
        self.assertEqual(rep_summary['total_expenses'], 300.0)
        self.assertEqual(rep_summary['net_cash_flow'], 19700.0)
        self.assertEqual(rep_summary['savings_rate'], 98.5)

    def test_04_user_b_cannot_access_user_a_resources(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        headers_b = {'Authorization': f'Bearer {self.token_b}'}

        res_acc_a = self.client.post('/api/accounts', json={'name': 'Private Bank', 'type': 'Bank Account', 'opening_balance': 50000.0}, headers=headers_a)
        acc_a_id = json.loads(res_acc_a.data)['id']

        # User B listing accounts
        res_b_accs = self.client.get('/api/accounts', headers=headers_b)
        self.assertEqual(len(json.loads(res_b_accs.data)), 0)

        # User B listing transactions
        res_b_txs = self.client.get('/api/transactions', headers=headers_b)
        self.assertEqual(len(json.loads(res_b_txs.data)), 0)

if __name__ == '__main__':
    unittest.main()
