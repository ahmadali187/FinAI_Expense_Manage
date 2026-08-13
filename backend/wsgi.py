import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app import app, socketio

application = app

if __name__ == '__main__':
    from waitress import serve
    print("Starting FinAI Expense Manager Production WSGI Server on http://127.0.0.1:5000 ...")
    serve(app, host='127.0.0.1', port=5000)
