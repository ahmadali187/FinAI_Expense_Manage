import os
import sys
import unittest
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Transaction, Account, Budget, SavingsGoal
from services.financial_aggregation import (
    calculate_unified_budget_status,
    get_centralized_system_summary,
    get_user_financial_profile
)
from services.admin_copilot import get_admin_stats

class CrossPageDataConsistencyTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Create test user & budget
        self.test_user = User.query.filter_by(email='consistency_user@test.com').first()
        if not self.test_user:
            self.test_user = User(
                name='Consistency Test User',
                email='consistency_user@test.com',
                password_hash='pass123',
                role='user',
                is_active=True
            )
            db.session.add(self.test_user)
            db.session.commit()

        # Add sample account
        acc = Account.query.filter_by(user_id=self.test_user.id, name='Test Account').first()
        if not acc:
            acc = Account(user_id=self.test_user.id, name='Test Account', current_balance=5000.0)
            db.session.add(acc)
            db.session.commit()

        # Add sample budget & transactions
        bg = Budget.query.filter_by(user_id=self.test_user.id, category='TestCategory').first()
        if not bg:
            bg = Budget(user_id=self.test_user.id, category='TestCategory', amount=1000.0)
            db.session.add(bg)
            db.session.commit()

        tx1 = Transaction(user_id=self.test_user.id, type='expense', amount=1200.0, category='TestCategory', date='2026-08-13', description='Exceeding expense')
        tx2 = Transaction(user_id=self.test_user.id, type='income', amount=5000.0, category='Salary', date='2026-08-13', description='Salary income')
        db.session.add_all([tx1, tx2])
        db.session.commit()

    def test_single_source_of_truth_summary(self):
        """Verify that get_centralized_system_summary and get_admin_stats return identical results."""
        summary = get_centralized_system_summary()
        admin_stats = get_admin_stats()

        self.assertEqual(summary['users'], admin_stats['users'])
        self.assertEqual(summary['active_users'], admin_stats['active_users'])
        self.assertEqual(summary['admins'], admin_stats['admins'])
        self.assertEqual(summary['transactions'], admin_stats['transactions'])
        self.assertEqual(summary['total_income'], admin_stats['total_income'])
        self.assertEqual(summary['total_expenses'], admin_stats['total_expenses'])
        self.assertEqual(summary['net_cashflow'], admin_stats['net_cashflow'])

    def test_budget_exceeded_status_calculation(self):
        """Verify that calculate_unified_budget_status accurately identifies exceeded budget status."""
        bg = Budget.query.filter_by(user_id=self.test_user.id, category='TestCategory').first()
        self.assertIsNotNone(bg)

        b_stat = calculate_unified_budget_status(bg)
        self.assertEqual(b_stat['allocated_limit'], 1000.0)
        self.assertGreaterEqual(b_stat['spent_amount'], 1200.0)
        self.assertEqual(b_stat['status'], 'EXCEEDED')

    def test_user_financial_profile_aggregation(self):
        """Verify that user financial profile aggregates accounts, transactions, and budgets correctly."""
        profile = get_user_financial_profile(self.test_user.id)
        self.assertIsNotNone(profile)
        self.assertEqual(profile['profile']['email'], 'consistency_user@test.com')
        self.assertGreater(profile['financial_summary']['total_income'], 0)
        self.assertGreater(profile['financial_summary']['total_expenses'], 0)

if __name__ == '__main__':
    unittest.main()
