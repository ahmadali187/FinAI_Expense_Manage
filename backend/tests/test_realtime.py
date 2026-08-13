import os
import sys
import time
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, socketio

class RealTimeSynchronizationTest(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # User A
        self.user_a = User.query.filter_by(email='user_a_realtime@example.com').first()
        if not self.user_a:
            self.user_a = User(name='User A', email='user_a_realtime@example.com', password_hash='pass123')
            db.session.add(self.user_a)

        # User B
        self.user_b = User.query.filter_by(email='user_b_realtime@example.com').first()
        if not self.user_b:
            self.user_b = User(name='User B', email='user_b_realtime@example.com', password_hash='pass123')
            db.session.add(self.user_b)

        db.session.commit()

        self.token_a = jwt.encode(
            {'user_id': self.user_a.id, 'email': self.user_a.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )

        self.token_b = jwt.encode(
            {'user_id': self.user_b.id, 'email': self.user_b.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )

    def tearDown(self):
        db.session.remove()
        self.app_context.pop()

    def test_authenticated_socket_connection(self):
        socket_client = socketio.test_client(app, auth={'token': self.token_a})
        self.assertTrue(socket_client.is_connected())
        received = socket_client.get_received()
        self.assertTrue(any(msg['name'] == 'connected' for msg in received))
        socket_client.disconnect()

    def test_unauthenticated_socket_rejected(self):
        socket_client = socketio.test_client(app, auth={'token': 'invalid_token'})
        self.assertFalse(socket_client.is_connected())

    def test_cross_user_isolation(self):
        client_a = socketio.test_client(app, auth={'token': self.token_a})
        client_b = socketio.test_client(app, auth={'token': self.token_b})

        start_time = time.perf_counter()
        # Add transaction for User A via REST API
        response = self.client.post(
            '/api/transactions',
            json={'amount': 500, 'category': 'Food', 'description': 'Realtime Test'},
            headers={'Authorization': f'Bearer {self.token_a}'}
        )
        end_time = time.perf_counter()
        self.assertEqual(response.status_code, 200)

        latency_ms = (end_time - start_time) * 1000.0
        print(f"\n--- REAL-TIME EVENT LATENCY ---")
        print(f"Database Commit -> Event Latency: {latency_ms:.2f} ms")

        # Client A must receive event
        received_a = client_a.get_received()
        self.assertTrue(any(msg['name'] == 'financial_event' for msg in received_a))

        # Client B must NOT receive any event
        received_b = client_b.get_received()
        self.assertFalse(any(msg['name'] == 'financial_event' for msg in received_b))

        client_a.disconnect()
        client_b.disconnect()

if __name__ == '__main__':
    unittest.main()
