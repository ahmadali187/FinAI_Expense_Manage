import unittest
import json
import datetime
import jwt
from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Account, Transaction

class ReportGenerationRepairTestSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Clean up existing test users if any
        User.query.filter(User.email.in_(['test_rep_a@finai.com', 'test_rep_b@finai.com'])).delete(synchronize_session=False)
        db.session.commit()

        # Create Test User A
        self.user_a = User(
            email='test_rep_a@finai.com',
            name='User A',
            password_hash=generate_password_hash('Password123!'),
            role='user'
        )
        db.session.add(self.user_a)

        # Create Test User B
        self.user_b = User(
            email='test_rep_b@finai.com',
            name='User B',
            password_hash=generate_password_hash('Password123!'),
            role='user'
        )
        db.session.add(self.user_b)
        db.session.commit()

        # Create Account for User A
        self.acc_a = Account(user_id=self.user_a.id, name='Test Bank', type='Bank Account', opening_balance=10000.0, current_balance=10000.0)
        db.session.add(self.acc_a)
        db.session.commit()

        # Generate JWT Tokens
        secret = self.app.config.get('SECRET_KEY', 'default_secret')
        self.token_a = jwt.encode({'user_id': self.user_a.id, 'email': self.user_a.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, secret, algorithm='HS256')
        self.token_b = jwt.encode({'user_id': self.user_b.id, 'email': self.user_b.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, secret, algorithm='HS256')

    def tearDown(self):
        Transaction.query.filter_by(user_id=self.user_a.id).delete(synchronize_session=False)
        Transaction.query.filter_by(user_id=self.user_b.id).delete(synchronize_session=False)
        Account.query.filter_by(user_id=self.user_a.id).delete(synchronize_session=False)
        User.query.filter(User.email.in_(['test_rep_a@finai.com', 'test_rep_b@finai.com'])).delete(synchronize_session=False)
        db.session.commit()
        self.app_context.pop()

    def test_01_transaction_creation_and_balance_update(self):
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # 1. Add Expense ₹500
        res_exp = self.client.post('/api/transactions', json={
            'amount': 500.0,
            'type': 'expense',
            'category': 'Food',
            'account_id': self.acc_a.id,
            'date': '2026-08-18',
            'description': 'Lunch'
        }, headers=headers)
        self.assertEqual(res_exp.status_code, 200)

        # 2. Add Income ₹2000
        res_inc = self.client.post('/api/transactions', json={
            'amount': 2000.0,
            'type': 'income',
            'category': 'Salary',
            'account_id': self.acc_a.id,
            'date': '2026-08-18',
            'description': 'Bonus'
        }, headers=headers)
        self.assertEqual(res_inc.status_code, 200)

        # 3. Check Account Balance (10000 - 500 + 2000 = 11500)
        acc = Account.query.get(self.acc_a.id)
        self.assertEqual(acc.current_balance, 11500.0)

    def test_02_report_generation_success_and_totals(self):
        headers = {'Authorization': f'Bearer {self.token_a}'}

        # Create transactions
        self.client.post('/api/transactions', json={
            'amount': 100.0, 'type': 'expense', 'category': 'Food', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'TEST EXPENSE'
        }, headers=headers)

        self.client.post('/api/transactions', json={
            'amount': 500.0, 'type': 'income', 'category': 'Salary', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'TEST INCOME'
        }, headers=headers)

        # Test GET /api/reports/generate
        res = self.client.get('/api/reports/generate?from_date=2026-08-01&to_date=2026-08-31', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)

        self.assertIn('summary', data)
        self.assertEqual(data['summary']['total_income'], 500.0)
        self.assertEqual(data['summary']['total_expenses'], 100.0)
        self.assertEqual(data['summary']['net_cash_flow'], 400.0)
        self.assertEqual(data['summary']['transaction_count'], 2)

    def test_03_user_data_isolation(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        headers_b = {'Authorization': f'Bearer {self.token_b}'}

        # User A creates transaction
        self.client.post('/api/transactions', json={
            'amount': 1200.0, 'type': 'expense', 'category': 'Shopping', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'User A Secret Purchase'
        }, headers=headers_a)

        # User B fetches transactions
        res_b_tx = self.client.get('/api/transactions', headers=headers_b)
        data_b_tx = json.loads(res_b_tx.data)
        self.assertEqual(len(data_b_tx), 0)

        # User B generates report
        res_b_rep = self.client.get('/api/reports/generate', headers=headers_b)
        data_b_rep = json.loads(res_b_rep.data)
        self.assertEqual(data_b_rep['summary']['transaction_count'], 0)
        self.assertEqual(data_b_rep['summary']['total_income'], 0)
        self.assertEqual(data_b_rep['summary']['total_expenses'], 0)

if __name__ == '__main__':
    unittest.main()
