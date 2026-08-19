import unittest
import json
import jwt
import datetime
from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Account, Transaction

class FullProductionRepairTestSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Clean up existing test users if any
        User.query.filter(User.email.in_(['e2e_user_a@finai.com', 'e2e_user_b@finai.com'])).delete(synchronize_session=False)
        db.session.commit()

        # Create Test User A
        self.user_a = User(
            email='e2e_user_a@finai.com',
            name='User A',
            password_hash=generate_password_hash('Password123!'),
            role='user'
        )
        db.session.add(self.user_a)

        # Create Test User B
        self.user_b = User(
            email='e2e_user_b@finai.com',
            name='User B',
            password_hash=generate_password_hash('Password123!'),
            role='user'
        )
        db.session.add(self.user_b)
        db.session.commit()

        # Create Account for User A (Opening Balance: ₹20,000)
        self.acc_a = Account(
            user_id=self.user_a.id,
            name='Bob Bank',
            type='Bank Account',
            opening_balance=20000.0,
            current_balance=20000.0
        )
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
        User.query.filter(User.email.in_(['e2e_user_a@finai.com', 'e2e_user_b@finai.com'])).delete(synchronize_session=False)
        db.session.commit()
        self.app_context.pop()

    def test_canonical_transaction_pipeline(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        headers_b = {'Authorization': f'Bearer {self.token_b}'}

        # 1. Add ₹300 Transport Expense
        res1 = self.client.post('/api/transactions', json={
            'amount': 300.0,
            'type': 'expense',
            'category': 'Transport',
            'account_id': self.acc_a.id,
            'date': '2026-08-18',
            'description': 'Taxi Ride'
        }, headers=headers_a)
        self.assertEqual(res1.status_code, 200)

        # 2. Add ₹15,000 Salary Income
        res2 = self.client.post('/api/transactions', json={
            'amount': 15000.0,
            'type': 'income',
            'category': 'Salary',
            'account_id': self.acc_a.id,
            'date': '2026-08-18',
            'description': 'Monthly Paycheck'
        }, headers=headers_a)
        self.assertEqual(res2.status_code, 200)

        # 3. Add ₹5,000 Business Income
        res3 = self.client.post('/api/transactions', json={
            'amount': 5000.0,
            'type': 'income',
            'category': 'Business',
            'account_id': self.acc_a.id,
            'date': '2026-08-18',
            'description': 'Client Project'
        }, headers=headers_a)
        self.assertEqual(res3.status_code, 200)

        # 4. Verify Account Balance (20000 - 300 + 15000 + 5000 = 39700)
        acc = Account.query.get(self.acc_a.id)
        self.assertEqual(acc.current_balance, 39700.0)

        # 5. Verify GET /api/transactions returns 3 transactions
        res_txs = self.client.get('/api/transactions', headers=headers_a)
        txs_data = json.loads(res_txs.data)
        self.assertEqual(len(txs_data), 3)

        # 6. Verify GET /api/accounts returns transaction_count = 3
        res_accs = self.client.get('/api/accounts', headers=headers_a)
        accs_data = json.loads(res_accs.data)
        self.assertEqual(len(accs_data), 1)
        self.assertEqual(accs_data[0]['transaction_count'], 3)
        self.assertEqual(accs_data[0]['current_balance'], 39700.0)

        # 7. Verify GET /api/dashboard returns matching 3 transactions
        res_dash = self.client.get('/api/dashboard', headers=headers_a)
        dash_data = json.loads(res_dash.data)
        self.assertEqual(len(dash_data['transactions']), 3)

        # 8. Verify GET /api/reports/generate summary & breakdown
        res_rep = self.client.get('/api/reports/generate?from_date=2026-08-01&to_date=2026-08-31', headers=headers_a)
        rep_data = json.loads(res_rep.data)
        self.assertEqual(rep_data['summary']['total_income'], 20000.0)
        self.assertEqual(rep_data['summary']['total_expense'], 300.0)
        self.assertEqual(rep_data['summary']['net_cash_flow'], 19700.0)

        # Verify expense breakdown only contains Transport ₹300
        cat_breakdown = rep_data['category_breakdown']
        exp_cats = [c for c in cat_breakdown if c['type'] == 'expense']
        inc_cats = [c for c in cat_breakdown if c['type'] == 'income']
        self.assertEqual(len(exp_cats), 1)
        self.assertEqual(exp_cats[0]['category'], 'Transport')
        self.assertEqual(exp_cats[0]['amount'], 300.0)
        self.assertEqual(len(inc_cats), 2)

        # 9. Verify User B Isolation (Zero leakage)
        res_b_txs = self.client.get('/api/transactions', headers=headers_b)
        self.assertEqual(len(json.loads(res_b_txs.data)), 0)

        res_b_accs = self.client.get('/api/accounts', headers=headers_b)
        self.assertEqual(len(json.loads(res_b_accs.data)), 0)

if __name__ == '__main__':
    unittest.main()
