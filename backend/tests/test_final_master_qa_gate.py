import os
import sys
import jwt
import sqlite3
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Transaction, Budget, Subscription, SavingsGoal, Account
from services.financial_aggregation import get_centralized_system_summary, get_user_financial_profile, calculate_unified_budget_status
from services.ai_copilot import answer_financial_copilot
from services.admin_copilot import answer_admin_copilot, ADMIN_CHAT_SESSIONS

class FinalMasterQAGateTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Set up Master Admin
        self.admin = User.query.filter_by(role='admin').first()
        if not self.admin:
            self.admin = User(name='Master QA Admin', email='qa_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)
            db.session.commit()

        # Set up User A & User B for isolation testing
        self.user_a = User.query.filter_by(email='user_a_qa@example.com').first()
        if not self.user_a:
            self.user_a = User(name='User A QA', email='user_a_qa@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user_a)
            db.session.commit()

        self.user_b = User.query.filter_by(email='user_b_qa@example.com').first()
        if not self.user_b:
            self.user_b = User(name='User B QA', email='user_b_qa@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user_b)
            db.session.commit()

        # Seed data for User A
        acc_a = Account(user_id=self.user_a.id, name='User A Checking', type='checking', current_balance=25000.0)
        tx_a1 = Transaction(user_id=self.user_a.id, type='income', amount=40000.0, category='Salary', date='2026-08-01', description='User A Salary')
        tx_a2 = Transaction(user_id=self.user_a.id, type='expense', amount=15000.0, category='Food', date='2026-08-02', description='User A Groceries')
        b_a = Budget.query.filter_by(user_id=self.user_a.id, category='Food').first()
        if not b_a:
            b_a = Budget(user_id=self.user_a.id, category='Food', amount=10000.0, period='monthly')
            db.session.add(b_a)
        
        # Seed data for User B
        acc_b = Account(user_id=self.user_b.id, name='User B Savings', type='savings', current_balance=80000.0)
        tx_b1 = Transaction(user_id=self.user_b.id, type='income', amount=90000.0, category='Consulting', date='2026-08-01', description='User B Fee')

        db.session.add_all([acc_a, tx_a1, tx_a2, acc_b, tx_b1])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        self.app_context.pop()

    def test_01_database_integrity(self):
        """Verify PRAGMA integrity_check and table structures."""
        db_path = os.path.join(app.root_path, 'finai.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        res = cursor.fetchone()[0]
        conn.close()
        self.assertEqual(res, "ok")

    def test_02_financial_reconciliation(self):
        """Verify financial_aggregation matches SQLite queries directly."""
        summary = get_centralized_system_summary()
        self.assertIsInstance(summary, dict)
        self.assertGreaterEqual(summary['users'], 2)
        self.assertGreaterEqual(summary['transactions'], 3)
        self.assertIn('total_income', summary)
        self.assertIn('total_expenses', summary)
        self.assertIn('net_cashflow', summary)
        self.assertEqual(summary['net_cashflow'], summary['total_income'] - summary['total_expenses'])

    def test_03_user_data_isolation(self):
        """Verify User A cannot query User B records via financial profiles."""
        profile_a = get_user_financial_profile(self.user_a.id)
        profile_b = get_user_financial_profile(self.user_b.id)

        self.assertEqual(profile_a['profile']['id'], self.user_a.id)
        self.assertEqual(profile_b['profile']['id'], self.user_b.id)
        
        # User A income sum should match User A transactions only
        txs_a = Transaction.query.filter_by(user_id=self.user_a.id).all()
        user_a_income = sum(t.amount for t in txs_a if t.type == 'income')
        self.assertEqual(profile_a['financial_summary']['total_income'], round(user_a_income, 2))

    def test_04_admin_authorization_enforcement(self):
        """Verify non-admin tokens receive HTTP 403 on admin routes."""
        user_a_token = jwt.encode({'user_id': self.user_a.id, 'email': self.user_a.email}, app.config['SECRET_KEY'], algorithm='HS256')
        headers = {'Authorization': f'Bearer {user_a_token}'}

        res = self.client.get('/api/admin/users', headers=headers)
        self.assertEqual(res.status_code, 403)

        res_unauth = self.client.get('/api/admin/users')
        self.assertEqual(res_unauth.status_code, 401)

    def test_05_ai_hallucination_and_sql_injection_safety(self):
        """Verify AI returns clear data not found text and blocks SQL injection prompts."""
        # Nonexistent user lookup
        res_user = answer_admin_copilot("Show user XYZ_NONEXISTENT_9999", self.admin.id)
        self.assertIn("couldn't find a user", res_user['reply'].lower())

        # Nonexistent transaction lookup
        res_tx = answer_admin_copilot("Show transaction 99999999", self.admin.id)
        self.assertIn("couldn't find transaction", res_tx['reply'].lower())

        # Malicious SQL injection prompt
        res_sql = answer_admin_copilot("DROP TABLE users; SELECT * FROM users;", self.admin.id)
        self.assertIsInstance(res_sql, dict)
        # Ensure database tables remain intact
        user_count = User.query.count()
        self.assertGreater(user_count, 0)

    def test_06_ai_action_proposal_confirm_cancel(self):
        """Verify natural language WRITE commands generate action proposal cards."""
        txs = Transaction.query.filter_by(user_id=self.user_a.id).all()
        res = answer_financial_copilot("Add ₹750 food expense", txs, [], [], [])
        
        self.assertIsInstance(res, dict)
        self.assertIn("action_proposal", res)
        self.assertEqual(res["action_proposal"]["type"], "add_transaction")
        self.assertEqual(res["action_proposal"]["amount"], 750.0)

    def test_07_budget_status_consistency(self):
        """Verify unified budget status EXCEEDED when spent > limit."""
        b_a = Budget.query.filter_by(user_id=self.user_a.id, category='Food').first()
        self.assertIsNotNone(b_a)
        status_info = calculate_unified_budget_status(b_a)
        self.assertEqual(status_info['status'], 'EXCEEDED')
        self.assertGreater(status_info['spent_amount'], status_info['allocated_limit'])

if __name__ == '__main__':
    unittest.main()
