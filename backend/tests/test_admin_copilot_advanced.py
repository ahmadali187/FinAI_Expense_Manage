import os
import sys
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Transaction
from services.admin_copilot import answer_admin_copilot, ADMIN_CHAT_SESSIONS

class AdvancedAdminCopilotTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Admin user
        self.admin = User.query.filter_by(email='nlu_admin@example.com').first()
        if not self.admin:
            self.admin = User(name='NLU Admin', email='nlu_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)
        else:
            self.admin.role = 'admin'
            self.admin.is_active = True

        # Normal User
        self.user = User.query.filter_by(email='nlu_user@example.com').first()
        if not self.user:
            self.user = User(name='NLU User', email='nlu_user@example.com', password_hash='pass123', role='user', is_active=True)
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

    def test_list_admins_structured_response(self):
        res = answer_admin_copilot("Who are the admins?", self.admin.id)
        self.assertIn(res['type'], ['table', 'admin_list'])
        self.assertIn('headers', res)
        self.assertIn('rows', res)

    def test_multi_turn_conversational_followup(self):
        # Turn 1: Count admins
        res1 = answer_admin_copilot("How many admins do we have?", self.admin.id)
        self.assertIn("System Administrators", res1['reply'])

        # Turn 2: Followup pronoun "Who are they?"
        res2 = answer_admin_copilot("Who are they?", self.admin.id)
        self.assertIn(res2['type'], ['table', 'admin_list'])
        self.assertIn('rows', res2)

    def test_date_range_queries(self):
        res_this_month = answer_admin_copilot("What is our total expense this month?", self.admin.id)
        self.assertIn("Financial", res_this_month['reply'])

        res_compare = answer_admin_copilot("Compare this month with last month", self.admin.id)
        self.assertIn("Monthly Financial Comparison", res_compare['reply'])

    def test_admin_copilot_endpoint_advanced(self):
        res = self.client.post('/api/admin/ai/chat', json={'query': 'Tell me the names of the admins'}, headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn(data['type'], ['table', 'admin_list'])
        self.assertIn('rows', data)

    def test_normal_user_access_denied(self):
        res = self.client.post('/api/admin/ai/chat', json={'query': 'Who are the admins?'}, headers={'Authorization': f'Bearer {self.user_token}'})
        self.assertEqual(res.status_code, 403)

if __name__ == '__main__':
    unittest.main()
