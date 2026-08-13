import os
import sys
import time
import statistics
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User

class PerformanceBenchmark(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        user = User.query.filter_by(email='bench_user@example.com').first()
        if not user:
            user = User(name='Bench User', email='bench_user@example.com', password_hash='pass123')
            db.session.add(user)
            db.session.commit()

        token = jwt.encode(
            {'user_id': user.id, 'email': user.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        self.headers = {'Authorization': f'Bearer {token}'}

    def tearDown(self):
        self.app_context.pop()

    def _benchmark_endpoint(self, endpoint, iterations):
        latencies = []
        for _ in range(iterations):
            start = time.perf_counter()
            res = self.client.get(endpoint, headers=self.headers)
            end = time.perf_counter()
            self.assertEqual(res.status_code, 200)
            latencies.append((end - start) * 1000.0) # convert to ms

        latencies.sort()
        avg_ms = statistics.mean(latencies)
        median_ms = statistics.median(latencies)
        p95_ms = latencies[int(0.95 * len(latencies))]
        p99_ms = latencies[int(0.99 * len(latencies))]
        max_ms = max(latencies)

        print(f"\n--- BENCHMARK RESULTS: {endpoint} ({iterations} requests) ---")
        print(f"Average: {avg_ms:.2f} ms")
        print(f"Median : {median_ms:.2f} ms")
        print(f"P95    : {p95_ms:.2f} ms")
        print(f"P99    : {p99_ms:.2f} ms")
        print(f"Maximum: {max_ms:.2f} ms")
        return {
            'endpoint': endpoint,
            'requests': iterations,
            'avg': round(avg_ms, 2),
            'median': round(median_ms, 2),
            'p95': round(p95_ms, 2),
            'p99': round(p99_ms, 2),
            'max': round(max_ms, 2)
        }

    def test_benchmark_suite(self):
        endpoints = [
            '/api/dashboard',
            '/api/transactions',
            '/api/accounts',
            '/api/budgets',
            '/api/goals',
            '/api/subscriptions',
            '/api/notifications'
        ]
        sample_sizes = [50, 100, 500, 1000]

        for ep in endpoints:
            for n in sample_sizes:
                self._benchmark_endpoint(ep, n)

if __name__ == '__main__':
    unittest.main()
