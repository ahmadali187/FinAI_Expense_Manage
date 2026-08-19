import unittest
import json
import jwt
import datetime
from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Account, Transaction

class ProductionIntegrityVerificationTestSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Clean up existing test users if any
        User.query.filter(User.email.in_(['integrity_a@finai.com', 'integrity_b@finai.com'])).delete(synchronize_session=False)
        db.session.commit()

        # Create Test User A
        self.user_a = User(
            email='integrity_a@finai.com',
            name='Integrity User A',
            password_hash=generate_password_hash('Password123!'),
            role='user'
        )
        db.session.add(self.user_a)

        # Create Test User B
        self.user_b = User(
            email='integrity_b@finai.com',
            name='Integrity User B',
            password_hash=generate_password_hash('Password123!'),
            role='user'
        )
        db.session.add(self.user_b)
        db.session.commit()

        # Create Account for User A (Opening Balance: ₹20,000)
        self.acc_a = Account(
            user_id=self.user_a.id,
            name='Bob bank',
            type='Bank Account',
            opening_balance=20000.0,
            current_balance=20000.0
        )
        db.session.add(self.acc_a)
        db.session.commit()

        # Generate Tokens
        secret = self.app.config.get('SECRET_KEY', 'default_secret')
        self.token_a = jwt.encode({'user_id': self.user_a.id, 'email': self.user_a.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, secret, algorithm='HS256')
        self.token_b = jwt.encode({'user_id': self.user_b.id, 'email': self.user_b.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, secret, algorithm='HS256')

    def tearDown(self):
        Transaction.query.filter_by(user_id=self.user_a.id).delete(synchronize_session=False)
        Transaction.query.filter_by(user_id=self.user_b.id).delete(synchronize_session=False)
        Account.query.filter_by(user_id=self.user_a.id).delete(synchronize_session=False)
        User.query.filter(User.email.in_(['integrity_a@finai.com', 'integrity_b@finai.com'])).delete(synchronize_session=False)
        db.session.commit()
        self.app_context.pop()

    def test_01_dashboard_transaction_count_matches_database(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        # Add 3 Transactions
        self.client.post('/api/transactions', json={'amount': 300.0, 'type': 'expense', 'category': 'Transport', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Taxi'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 15000.0, 'type': 'income', 'category': 'Salary', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Paycheck'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 5000.0, 'type': 'income', 'category': 'Business', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Client'}, headers=headers_a)

        db_count = Transaction.query.filter_by(user_id=self.user_a.id).count()
        self.assertEqual(db_count, 3)

        res_dash = self.client.get('/api/dashboard', headers=headers_a)
        dash_data = json.loads(res_dash.data)
        self.assertEqual(len(dash_data['transactions']), db_count)

    def test_02_accounts_transaction_count_matches_database(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        self.client.post('/api/transactions', json={'amount': 300.0, 'type': 'expense', 'category': 'Transport', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Taxi'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 15000.0, 'type': 'income', 'category': 'Salary', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Paycheck'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 5000.0, 'type': 'income', 'category': 'Business', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Client'}, headers=headers_a)

        res_accs = self.client.get('/api/accounts', headers=headers_a)
        accs_data = json.loads(res_accs.data)
        self.assertEqual(len(accs_data), 1)
        self.assertEqual(accs_data[0]['transaction_count'], 3)

    def test_03_report_transaction_count_matches_database(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        self.client.post('/api/transactions', json={'amount': 300.0, 'type': 'expense', 'category': 'Transport', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Taxi'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 15000.0, 'type': 'income', 'category': 'Salary', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Paycheck'}, headers=headers_a)

        res_rep = self.client.get('/api/reports/generate?from_date=2026-08-01&to_date=2026-08-31', headers=headers_a)
        rep_data = json.loads(res_rep.data)
        self.assertEqual(rep_data['summary']['transaction_count'], 2)

    def test_04_home_and_report_totals_match(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        self.client.post('/api/transactions', json={'amount': 300.0, 'type': 'expense', 'category': 'Transport', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Taxi'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 15000.0, 'type': 'income', 'category': 'Salary', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Paycheck'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 5000.0, 'type': 'income', 'category': 'Business', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Client'}, headers=headers_a)

        res_dash = self.client.get('/api/dashboard', headers=headers_a)
        dash_txs = json.loads(res_dash.data)['transactions']
        dash_income = sum(t['amount'] for t in dash_txs if t['type'] == 'income')
        dash_expense = sum(t['amount'] for t in dash_txs if t['type'] == 'expense')

        res_rep = self.client.get('/api/reports/generate?from_date=2026-08-01&to_date=2026-08-31', headers=headers_a)
        rep_summary = json.loads(res_rep.data)['summary']

        self.assertEqual(dash_income, rep_summary['total_income'])
        self.assertEqual(dash_expense, rep_summary['total_expense'])
        self.assertEqual(dash_income - dash_expense, rep_summary['net_cash_flow'])

    def test_05_income_not_in_expense_breakdown(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        self.client.post('/api/transactions', json={'amount': 300.0, 'type': 'expense', 'category': 'Transport', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Taxi'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 15000.0, 'type': 'income', 'category': 'Salary', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Paycheck'}, headers=headers_a)

        res_rep = self.client.get('/api/reports/generate?from_date=2026-08-01&to_date=2026-08-31', headers=headers_a)
        cat_breakdown = json.loads(res_rep.data)['category_breakdown']

        exp_cats = [c for c in cat_breakdown if c['type'] == 'expense']
        inc_cats = [c for c in cat_breakdown if c['type'] == 'income']

        self.assertTrue(all(c['category'] != 'Salary' for c in exp_cats))
        self.assertEqual(len(exp_cats), 1)
        self.assertEqual(exp_cats[0]['category'], 'Transport')
        self.assertEqual(exp_cats[0]['amount'], 300.0)

    def test_06_account_balance_matches_transaction_flow(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        # Opening ₹20,000
        # -300 Expense
        # +15,000 Salary
        # +5,000 Business
        # Expected = 39,700
        self.client.post('/api/transactions', json={'amount': 300.0, 'type': 'expense', 'category': 'Transport', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Taxi'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 15000.0, 'type': 'income', 'category': 'Salary', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Paycheck'}, headers=headers_a)
        self.client.post('/api/transactions', json={'amount': 5000.0, 'type': 'income', 'category': 'Business', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Client'}, headers=headers_a)

        acc = Account.query.get(self.acc_a.id)
        self.assertEqual(acc.current_balance, 39700.0)

    def test_07_user_a_cannot_see_user_b_transactions(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}
        headers_b = {'Authorization': f'Bearer {self.token_b}'}

        # Create tx for A
        res_a = self.client.post('/api/transactions', json={'amount': 1200.0, 'type': 'expense', 'category': 'Shopping', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Secret'}, headers=headers_a)
        tx_a_id = json.loads(res_a.data)['id']

        # User B attempts to GET A's transaction directly or list
        res_b_list = self.client.get('/api/transactions', headers=headers_b)
        self.assertEqual(len(json.loads(res_b_list.data)), 0)

        res_b_single = self.client.get(f'/api/transactions/{tx_a_id}', headers=headers_b)
        self.assertIn(res_b_single.status_code, [404, 403, 405])

    def test_08_edit_and_delete_transaction_recalculation(self):
        headers_a = {'Authorization': f'Bearer {self.token_a}'}

        # 1. Create ₹300 Expense (Balance: 20000 - 300 = 19700)
        res_create = self.client.post('/api/transactions', json={'amount': 300.0, 'type': 'expense', 'category': 'Transport', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Taxi'}, headers=headers_a)
        tx_id = json.loads(res_create.data)['id']

        acc1 = Account.query.get(self.acc_a.id)
        self.assertEqual(acc1.current_balance, 19700.0)

        # 2. Edit ₹300 -> ₹700 (Balance: 20000 - 700 = 19300)
        res_edit = self.client.put(f'/api/transactions/{tx_id}', json={'amount': 700.0, 'type': 'expense', 'category': 'Transport', 'account_id': self.acc_a.id, 'date': '2026-08-18', 'description': 'Long Taxi'}, headers=headers_a)
        self.assertEqual(res_edit.status_code, 200)

        acc2 = Account.query.get(self.acc_a.id)
        self.assertEqual(acc2.current_balance, 19300.0)

        # 3. Delete transaction (Balance restores to 20000)
        res_del = self.client.delete(f'/api/transactions/{tx_id}', headers=headers_a)
        self.assertEqual(res_del.status_code, 200)

        acc3 = Account.query.get(self.acc_a.id)
        self.assertEqual(acc3.current_balance, 20000.0)

if __name__ == '__main__':
    unittest.main()
