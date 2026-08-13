import os
import sys
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Account, Transaction, SavingsGoal, Budget
from services.admin_copilot import answer_admin_copilot, get_admin_stats

class EndToEndProductionAcceptanceTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Setup Admin User
        self.admin = User.query.filter_by(email='e2e_admin@example.com').first()
        if not self.admin:
            self.admin = User(name='E2E Admin', email='e2e_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)
        else:
            self.admin.role = 'admin'
            self.admin.is_active = True

        # Setup Normal User
        self.user = User.query.filter_by(email='e2e_user@example.com').first()
        if not self.user:
            self.user = User(name='E2E User', email='e2e_user@example.com', password_hash='pass123', role='user', is_active=True)
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

    # 1. DATABASE TRUTH TEST
    def test_01_database_truth_verification(self):
        # Query SQLite directly
        db_user_count = User.query.count()
        db_admin_count = User.query.filter_by(role='admin').count()
        db_account_count = Account.query.count()
        db_tx_count = Transaction.query.count()
        db_goal_count = SavingsGoal.query.count()
        db_budget_count = Budget.query.count()

        # Query Admin API
        res_summary = self.client.get('/api/admin/database-summary', headers={'Authorization': f'Bearer {self.admin_token}'}).get_json()
        
        # Verify 1:1 match between SQLite and API response
        self.assertEqual(db_user_count, res_summary['users'])
        self.assertEqual(db_admin_count, res_summary['admins'])
        self.assertEqual(db_account_count, res_summary['accounts'])
        self.assertEqual(db_tx_count, res_summary['transactions'])
        self.assertEqual(db_goal_count, res_summary['savings_goals'])
        self.assertEqual(db_budget_count, res_summary['budgets'])

        # Verify Admin Copilot stats match
        stats = get_admin_stats()
        self.assertEqual(db_user_count, stats['users'])
        self.assertEqual(db_admin_count, stats['admins'])
        self.assertEqual(db_account_count, stats['accounts'])
        self.assertEqual(db_tx_count, stats['transactions'])
        self.assertEqual(db_goal_count, stats['savings_goals'])

    # 2. CONTROLLED LIVE DATA SYNC TEST
    def test_02_live_data_mutation_and_copilot_sync(self):
        # Initial goal count
        initial_goals_res = self.client.get('/api/admin/savings-goals', headers={'Authorization': f'Bearer {self.admin_token}'}).get_json()
        initial_cnt = initial_goals_res['summary']['total_goals']

        # Insert temporary test goal
        test_goal = SavingsGoal(user_id=self.user.id, title='E2E Vacation Test Goal', target_amount=100000.0, current_amount=40000.0, target_date='2026-11-30')
        db.session.add(test_goal)
        db.session.commit()
        test_goal_id = test_goal.id

        try:
            # Query API -> Expect count + 1
            updated_goals_res = self.client.get('/api/admin/savings-goals', headers={'Authorization': f'Bearer {self.admin_token}'}).get_json()
            self.assertEqual(updated_goals_res['summary']['total_goals'], initial_cnt + 1)

            # Query Admin Copilot -> Expect live goal count
            copilot_res = answer_admin_copilot("Show savings goals", self.admin.id)
            self.assertIn(str(initial_cnt + 1), copilot_res['reply'])
        finally:
            # Clean up test data
            g_to_delete = db.session.get(SavingsGoal, test_goal_id)
            if g_to_delete:
                db.session.delete(g_to_delete)
                db.session.commit()

        # Re-verify cleanup
        clean_res = self.client.get('/api/admin/savings-goals', headers={'Authorization': f'Bearer {self.admin_token}'}).get_json()
        self.assertEqual(clean_res['summary']['total_goals'], initial_cnt)

    # 3. RBAC AND SECURITY AUTHORIZATION TEST
    def test_03_admin_rbac_and_security(self):
        admin_endpoints = [
            '/api/admin/system-health',
            '/api/admin/database-summary',
            '/api/admin/users',
            '/api/admin/accounts',
            '/api/admin/transactions',
            '/api/admin/savings-goals',
            '/api/admin/budgets',
            '/api/admin/analytics',
            '/api/admin/tables',
            '/api/admin/activity-logs',
            '/api/admin/search?q=test'
        ]

        for ep in admin_endpoints:
            # Unauthenticated -> expect 401
            res_unauth = self.client.get(ep)
            self.assertEqual(res_unauth.status_code, 401, f"Unauthenticated request to {ep} did not return 401")

            # Normal user -> expect 403
            res_user = self.client.get(ep, headers={'Authorization': f'Bearer {self.user_token}'})
            self.assertEqual(res_user.status_code, 403, f"Normal user request to {ep} did not return 403")

            # Admin -> expect 200
            res_admin = self.client.get(ep, headers={'Authorization': f'Bearer {self.admin_token}'})
            self.assertEqual(res_admin.status_code, 200, f"Admin request to {ep} did not return 200")

    # 4. ADMIN COPILOT ZERO HALLUCINATION TEST
    def test_04_admin_copilot_queries(self):
        queries = [
            ("hey", "greeting"),
            ("how many users?", "summary"),
            ("show last 5 transactions", "transaction_list"),
            ("who spent the most?", "summary"),
            ("who saved the most?", "summary"),
            ("show savings goals", "summary"),
            ("show database health", "summary")
        ]

        for query, expected_type in queries:
            res = answer_admin_copilot(query, self.admin.id)
            self.assertEqual(res['type'], expected_type, f"Query '{query}' expected type '{expected_type}', got '{res['type']}'")
            self.assertIn('reply', res)
            self.assertTrue(len(res['reply']) > 5)

if __name__ == '__main__':
    unittest.main()
