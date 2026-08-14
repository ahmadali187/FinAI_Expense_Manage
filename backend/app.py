import os
import jwt
import datetime
import time
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

UNSAFE_SECRETS = {
    'secret',
    'development-secret',
    'finai_copilot_secret_jwt_key_2026',
    'change-me',
    'your_secure_random_jwt_secret_here',
    '12345',
    'password'
}

JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET or JWT_SECRET.strip() in UNSAFE_SECRETS:
    raise RuntimeError("JWT_SECRET environment variable is required and must not be set to a default or predictable value.")

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Transaction, Budget, Bill, Subscription, SavingsGoal, Asset, Liability, Account, Notification, ActivityLog, ReportTemplate
from services.safe_to_spend import calculate_safe_to_spend
from services.ai_copilot import parse_quick_add, answer_financial_copilot
from services.health_score import calculate_health_score
from services.cash_flow_forecast import calculate_cash_flow_forecast
from services.subscription_detector import detect_recurring_subscriptions
from services.admin_copilot import answer_admin_copilot, get_admin_stats

cors_origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '').strip()
if cors_origins_env and cors_origins_env != '*':
    allowed_origins = [o.strip() for o in cors_origins_env.split(',') if o.strip()]
else:
    allowed_origins = '*'

app = Flask(__name__)
CORS(app, origins=allowed_origins, supports_credentials=True)

SECRET_KEY = JWT_SECRET
app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'finai.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

@socketio.on('connect')
def handle_connect(auth=None):
    token = None
    if isinstance(auth, dict):
        token = auth.get('token')
    if not token and request.args.get('token'):
        token = request.args.get('token')

    if not token:
        disconnect()
        return False

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data.get('user_id')
        if not user_id:
            disconnect()
            return False
        join_room(f"user:{user_id}")
        emit('connected', {'user_id': user_id, 'status': 'authenticated'})
    except Exception:
        disconnect()
        return False

def emit_user_event(user_id, event_type, entity_id=None):
    try:
        payload = {
            'type': event_type,
            'entity_id': str(entity_id) if entity_id is not None else None,
            'timestamp': datetime.datetime.utcnow().isoformat()
        }
        socketio.emit('financial_event', payload, to=f"user:{user_id}")
    except Exception as e:
        print("Socket event emission failed:", e)

def ensure_admin_user():
    admin_email = os.environ.get('ADMIN_EMAIL')
    admin_password = os.environ.get('ADMIN_PASSWORD')

    if not admin_email or not admin_password:
        print("[ADMIN] ADMIN_EMAIL or ADMIN_PASSWORD environment variables not set.")
        return

    email = admin_email.strip().lower()
    password = admin_password.strip()

    try:
        user = User.query.filter_by(email=email).first()
        if user:
            user.role = 'admin'
            user.is_active = True
            if password:
                user.password_hash = password
            db.session.commit()
            print(f"[ADMIN] Existing user '{email}' successfully promoted/updated to Superuser Admin.")
        else:
            admin_user = User(
                name='FinAI System Admin',
                email=email,
                password_hash=password,
                auth_provider='email',
                role='admin',
                is_active=True
            )
            db.session.add(admin_user)
            db.session.commit()
            print(f"[ADMIN] New Superuser Admin '{email}' created successfully.")
    except Exception as e:
        db.session.rollback()
        print(f"[ADMIN] Automatic admin initialization error: {e}")

db.init_app(app)

with app.app_context():
    db.create_all()
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            # Transaction columns migration
            tx_columns = [row[1] for row in conn.execute(text("PRAGMA table_info(transactions)")).fetchall()]
            if 'account_id' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN account_id INTEGER"))
            if 'merchant' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN merchant VARCHAR(120)"))
            if 'payment_method' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash'"))
            if 'currency' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN currency VARCHAR(10) DEFAULT 'INR'"))
            if 'subcategory' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN subcategory VARCHAR(100)"))
            if 'notes' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN notes VARCHAR(255)"))
            if 'tags' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN tags VARCHAR(255)"))
            if 'receipt_ref' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN receipt_ref VARCHAR(255)"))
            if 'recurring_flag' not in tx_columns:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN recurring_flag BOOLEAN DEFAULT 0"))

            # User columns migration
            user_columns = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            if 'role' not in user_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
            if 'is_active' not in user_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))

            # Account columns migration
            acc_columns = [row[1] for row in conn.execute(text("PRAGMA table_info(accounts)")).fetchall()]
            if 'institution_name' not in acc_columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN institution_name VARCHAR(120)"))
            if 'last_four' not in acc_columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN last_four VARCHAR(10)"))
            if 'color' not in acc_columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN color VARCHAR(20) DEFAULT '#3B82F6'"))
            if 'icon' not in acc_columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN icon VARCHAR(50) DEFAULT 'wallet'"))
            if 'is_archived' not in acc_columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN is_archived BOOLEAN DEFAULT 0"))

            conn.commit()
    except Exception as e:
        print("SQLite auto-migration info:", e)

    ensure_admin_user()

@app.route('/')
def index():
    render_url = os.environ.get('RENDER_EXTERNAL_URL')
    env_api_url = os.environ.get('BACKEND_PUBLIC_URL') or os.environ.get('REACT_APP_API_URL') or os.environ.get('VITE_API_URL')
    if render_url:
        api_base_url = f"{render_url.rstrip('/')}/api"
    elif env_api_url:
        api_base_url = env_api_url if env_api_url.endswith('/api') else f"{env_api_url.rstrip('/')}/api"
    else:
        api_base_url = request.host_url.rstrip('/') + '/api'

    return jsonify({
        'status': 'online',
        'service': 'FinAI — AI Personal Finance Copilot REST API',
        'version': '1.0.0',
        'api_base_url': api_base_url
    })

# --- Auth Token Middleware ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Authorization token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
            if getattr(current_user, 'is_active', True) is False:
                return jsonify({'message': 'User account has been deactivated by an administrator.'}), 403
        except Exception:
            return jsonify({'message': 'Invalid or expired token'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user or getattr(current_user, 'role', 'user') != 'admin' or getattr(current_user, 'is_active', True) is False:
            return jsonify({'message': 'Access denied: Administrator privileges required (HTTP 403)'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def generate_user_token(user):
    payload = {
        'user_id': user.id,
        'email': user.email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def log_activity(user_id, action_text):
    log = ActivityLog(user_id=user_id, action=action_text)
    db.session.add(log)
    db.session.commit()

# --- AUTH ENDPOINTS ---
@app.route('/api/auth/guest', methods=['POST'])
def guest_login():
    guest_email = 'user@finai.com'
    user = User.query.filter_by(email=guest_email).first()
    if not user:
        user = User(name='FinAI User', email=guest_email, password_hash='guest_pass_123', auth_provider='email')
        db.session.add(user)
        db.session.commit()
        db.session.add_all([
            Account(user_id=user.id, name='Primary Bank Account', type='Bank', current_balance=50000.0),
            Account(user_id=user.id, name='Cash Wallet', type='Cash', current_balance=5000.0),
            Account(user_id=user.id, name='Credit Card', type='Credit Card', current_balance=-8500.0)
        ])
        db.session.commit()

    token = generate_user_token(user)
    return jsonify({'token': token, 'user': user.to_dict()})

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    name = data.get('name', '').strip()
    password = data.get('password', '')

    if not email or not name or not password:
        return jsonify({'message': 'Please fill all fields'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Account with this email already exists'}), 400

    user = User(name=name, email=email, password_hash=password, auth_provider='email')
    db.session.add(user)
    db.session.commit()
    log_activity(user.id, 'User account registered')

    token = generate_user_token(user)
    return jsonify({'token': token, 'user': user.to_dict()})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email, password_hash=password).first()
    if not user:
        return jsonify({'message': 'Invalid email or password'}), 401

    token = generate_user_token(user)
    log_activity(user.id, 'Logged in via email/password')
    return jsonify({'token': token, 'user': user.to_dict()})

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json() or {}
    google_sub = data.get('sub')
    email = data.get('email', '').strip().lower()
    name = data.get('name', '')
    picture = data.get('picture', '')

    if not google_sub:
        return jsonify({'message': 'Missing Google sub identifier'}), 400

    user = User.query.filter_by(google_sub=google_sub).first()
    if not user and email:
        user = User.query.filter_by(email=email).first()
        if user:
            user.google_sub = google_sub
            user.picture = picture or user.picture
            db.session.commit()

    if not user:
        user = User(
            google_sub=google_sub,
            name=name or email.split('@')[0],
            email=email,
            picture=picture,
            auth_provider='google'
        )
        db.session.add(user)
        db.session.commit()

    token = generate_user_token(user)
    log_activity(user.id, 'Logged in via Google OAuth')
    return jsonify({'token': token, 'user': user.to_dict()})

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({'user': current_user.to_dict()})

@app.route('/api/auth/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.get_json() or {}
    current_pass = data.get('current_password', '')
    new_pass = data.get('new_password', '')

    if current_user.auth_provider == 'google' and not current_user.password_hash:
        # Set password for Google OAuth account
        current_user.password_hash = new_pass
        db.session.commit()
        log_activity(current_user.id, 'Set password for Google OAuth account')
        return jsonify({'message': 'Password set successfully'})

    if current_user.password_hash and current_user.password_hash != current_pass:
        return jsonify({'message': 'Current password is incorrect'}), 400

    if not new_pass or len(new_pass) < 6:
        return jsonify({'message': 'New password must be at least 6 characters'}), 400

    current_user.password_hash = new_pass
    db.session.commit()
    log_activity(current_user.id, 'Changed password successfully')
    return jsonify({'message': 'Password changed successfully'})

# --- ACCOUNTS ENDPOINTS ---
@app.route('/api/accounts', methods=['GET', 'POST'])
@token_required
def manage_accounts(current_user):
    if request.method == 'GET':
        include_archived = request.args.get('include_archived', '').lower() == 'true'
        if include_archived:
            accounts = Account.query.filter_by(user_id=current_user.id).all()
        else:
            accounts = Account.query.filter_by(user_id=current_user.id, is_archived=False).all()
        return jsonify([a.to_dict() for a in accounts])

    data = request.get_json() or {}
    opening_bal = float(data.get('opening_balance', 0))
    current_bal = float(data.get('current_balance', opening_bal))

    acc = Account(
        user_id=current_user.id,
        name=data.get('name', 'New Account'),
        type=data.get('type', 'Bank'),
        institution_name=data.get('institution_name', ''),
        last_four=data.get('last_four', ''),
        color=data.get('color', '#3B82F6'),
        icon=data.get('icon', 'wallet'),
        opening_balance=opening_bal,
        current_balance=current_bal,
        currency=data.get('currency', 'INR'),
        notes=data.get('notes', '')
    )
    db.session.add(acc)
    db.session.commit()
    log_activity(current_user.id, f"Created account '{acc.name}'")
    emit_user_event(current_user.id, 'account.created', acc.id)
    return jsonify(acc.to_dict())

@app.route('/api/accounts/<int:acc_id>', methods=['PUT', 'DELETE'])
@token_required
def single_account(current_user, acc_id):
    acc = Account.query.filter_by(id=acc_id, user_id=current_user.id).first()
    if not acc:
        return jsonify({'message': 'Account not found or access denied'}), 404

    if request.method == 'PUT':
        data = request.get_json() or {}
        acc.name = data.get('name', acc.name)
        acc.type = data.get('type', acc.type)
        if 'institution_name' in data:
            acc.institution_name = data.get('institution_name')
        if 'last_four' in data:
            acc.last_four = data.get('last_four')
        if 'color' in data:
            acc.color = data.get('color')
        if 'icon' in data:
            acc.icon = data.get('icon')
        if 'opening_balance' in data:
            diff = float(data.get('opening_balance')) - acc.opening_balance
            acc.opening_balance = float(data.get('opening_balance'))
            acc.current_balance += diff
        if 'current_balance' in data and 'opening_balance' not in data:
            acc.current_balance = float(data.get('current_balance'))
        if 'notes' in data:
            acc.notes = data.get('notes')
        if 'currency' in data:
            acc.currency = data.get('currency')

        db.session.commit()
        log_activity(current_user.id, f"Updated account '{acc.name}'")
        emit_user_event(current_user.id, 'account.updated', acc.id)
        return jsonify(acc.to_dict())

    # DELETE Logic
    tx_count = Transaction.query.filter_by(user_id=current_user.id, account_id=acc.id).count()
    action = request.args.get('action') or (request.get_json() or {}).get('action')

    if tx_count > 0 and action not in ['delete_all', 'archive', 'true', 'force']:
        return jsonify({
            'has_transactions': True,
            'transaction_count': tx_count,
            'message': f"This account has {tx_count} transaction{'s' if tx_count > 1 else ''}.",
            'can_archive': True
        }), 400

    if action == 'archive':
        acc.is_archived = True
        db.session.commit()
        log_activity(current_user.id, f"Archived account '{acc.name}'")
        emit_user_event(current_user.id, 'account.archived', acc.id)
        return jsonify({'message': f"Account '{acc.name}' archived successfully.", 'account': acc.to_dict()})

    if action in ['delete_all', 'true', 'force']:
        Transaction.query.filter_by(user_id=current_user.id, account_id=acc.id).delete()

    db.session.delete(acc)
    db.session.commit()
    log_activity(current_user.id, f"Deleted account '{acc.name}'")
    emit_user_event(current_user.id, 'account.deleted', acc_id)
    return jsonify({'success': True, 'message': 'Account deleted successfully.'})

@app.route('/api/accounts/<int:acc_id>/archive', methods=['PUT'])
@token_required
def archive_account(current_user, acc_id):
    acc = Account.query.filter_by(id=acc_id, user_id=current_user.id).first()
    if not acc:
        return jsonify({'message': 'Account not found or access denied'}), 404
    acc.is_archived = True
    db.session.commit()
    log_activity(current_user.id, f"Archived account '{acc.name}'")
    emit_user_event(current_user.id, 'account.archived', acc_id)
    return jsonify(acc.to_dict())

@app.route('/api/accounts/<int:acc_id>/restore', methods=['PUT'])
@token_required
def restore_account(current_user, acc_id):
    acc = Account.query.filter_by(id=acc_id, user_id=current_user.id).first()
    if not acc:
        return jsonify({'message': 'Account not found or access denied'}), 404
    acc.is_archived = False
    db.session.commit()
    log_activity(current_user.id, f"Restored account '{acc.name}'")
    emit_user_event(current_user.id, 'account.restored', acc_id)
    return jsonify(acc.to_dict())

# --- DASHBOARD ENDPOINT ---
@app.route('/api/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    accounts = Account.query.filter_by(user_id=current_user.id).all()
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.id.desc()).limit(100).all()
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    subscriptions = Subscription.query.filter_by(user_id=current_user.id).all()
    goals = SavingsGoal.query.filter_by(user_id=current_user.id).all()
    assets = Asset.query.filter_by(user_id=current_user.id).all()
    liabilities = Liability.query.filter_by(user_id=current_user.id).all()

    # Fast SQL aggregations
    total_income = db.session.query(db.func.sum(Transaction.amount)).filter_by(user_id=current_user.id, type='income').scalar() or 0.0
    total_expense = db.session.query(db.func.sum(Transaction.amount)).filter_by(user_id=current_user.id, type='expense').scalar() or 0.0
    income_count = db.session.query(db.func.count(Transaction.id)).filter_by(user_id=current_user.id, type='income').scalar() or 0
    expense_count = db.session.query(db.func.count(Transaction.id)).filter_by(user_id=current_user.id, type='expense').scalar() or 0

    cat_rows = db.session.query(Transaction.category, db.func.sum(Transaction.amount)).filter_by(user_id=current_user.id, type='expense').group_by(Transaction.category).all()
    category_expenses = {cat: amt for cat, amt in cat_rows}

    totals_override_health = {
        'total_income': total_income,
        'total_expense': total_expense,
        'category_expenses': category_expenses
    }

    avg_income = (total_income / max(1, income_count)) if income_count > 0 else 50000.0
    avg_daily_expense = ((total_expense / max(1, expense_count)) * 1.5) if expense_count > 0 else 800.0

    totals_override_forecast = {
        'avg_income': avg_income,
        'avg_daily_expense': avg_daily_expense
    }

    safe_to_spend = calculate_safe_to_spend(current_user.id, accounts, transactions, budgets, subscriptions, goals)
    health = calculate_health_score(transactions, budgets, liabilities, totals_override=totals_override_health)

    total_acc_balance = sum(a.current_balance for a in accounts) if accounts else (total_income - total_expense)
    forecast = calculate_cash_flow_forecast(current_user.id, total_acc_balance, subscriptions, transactions, goals, totals_override=totals_override_forecast)

    total_assets = sum(a.value for a in assets) + sum(max(0, acc.current_balance) for acc in accounts)
    total_liabilities = sum(l.amount for l in liabilities) + sum(abs(acc.current_balance) for acc in accounts if acc.current_balance < 0)
    net_worth = total_assets - total_liabilities

    return jsonify({
        'user': current_user.to_dict(),
        'safe_to_spend': safe_to_spend,
        'health': health,
        'forecast': forecast,
        'net_worth': {'net_worth': net_worth, 'total_assets': total_assets, 'total_liabilities': total_liabilities},
        'accounts': [a.to_dict() for a in accounts],
        'transactions': [t.to_dict() for t in transactions],
        'budgets': [b.to_dict() for b in budgets],
        'subscriptions': [s.to_dict() for s in subscriptions],
        'goals': [g.to_dict() for g in goals]
    })

# --- TRANSACTIONS API ---
@app.route('/api/transactions', methods=['GET', 'POST'])
@token_required
def manage_transactions(current_user):
    if request.method == 'GET':
        txs = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.id.desc()).all()
        return jsonify([t.to_dict() for t in txs])

    data = request.get_json() or {}
    amt = float(data.get('amount', 0))
    tx_type = data.get('type', 'expense')
    account_id = data.get('account_id')

    tx = Transaction(
        user_id=current_user.id,
        account_id=account_id,
        type=tx_type,
        amount=amt,
        category=data.get('category', 'Other'),
        merchant=data.get('merchant', ''),
        payment_method=data.get('payment_method', 'Cash'),
        date=data.get('date', datetime.date.today().isoformat()),
        description=data.get('description', '')
    )
    db.session.add(tx)

    # Auto update Account Balance
    if account_id:
        acc = Account.query.filter_by(id=account_id, user_id=current_user.id).first()
        if acc:
            if tx_type == 'income':
                acc.current_balance += amt
            else:
                acc.current_balance -= amt

    db.session.commit()
    log_activity(current_user.id, f"Added transaction {tx_type.upper()} ₹{amt}")
    emit_user_event(current_user.id, 'transaction.created', tx.id)
    return jsonify(tx.to_dict())

@app.route('/api/transactions/<int:tx_id>', methods=['PUT', 'DELETE'])
@token_required
def single_transaction(current_user, tx_id):
    tx = Transaction.query.filter_by(id=tx_id, user_id=current_user.id).first()
    if not tx:
        return jsonify({'message': 'Transaction not found or access denied'}), 404

    if request.method == 'DELETE':
        if tx.account_id:
            acc = Account.query.filter_by(id=tx.account_id, user_id=current_user.id).first()
            if acc:
                if tx.type == 'income':
                    acc.current_balance -= tx.amount
                else:
                    acc.current_balance += tx.amount

        db.session.delete(tx)
        db.session.commit()
        log_activity(current_user.id, f"Deleted transaction #{tx_id}")
        emit_user_event(current_user.id, 'transaction.deleted', tx_id)
        return jsonify({'success': True})

    # PUT Edit logic
    data = request.get_json() or {}
    old_amount = tx.amount
    old_type = tx.type
    old_account_id = tx.account_id

    # Reverse old balance effect
    if old_account_id:
        old_acc = Account.query.filter_by(id=old_account_id, user_id=current_user.id).first()
        if old_acc:
            if old_type == 'income':
                old_acc.current_balance -= old_amount
            else:
                old_acc.current_balance += old_amount

    new_amount = float(data.get('amount', tx.amount))
    new_type = data.get('type', tx.type)
    new_account_id = data.get('account_id', tx.account_id)

    tx.amount = new_amount
    tx.type = new_type
    tx.category = data.get('category', tx.category)
    tx.description = data.get('description', tx.description)
    tx.merchant = data.get('merchant', tx.merchant)
    tx.payment_method = data.get('payment_method', tx.payment_method)
    tx.account_id = new_account_id
    if 'date' in data and data['date']:
        try:
            tx.date = datetime.datetime.strptime(data['date'].split('T')[0], '%Y-%m-%d')
        except Exception:
            pass

    # Apply new balance effect
    if new_account_id:
        new_acc = Account.query.filter_by(id=new_account_id, user_id=current_user.id).first()
        if new_acc:
            if new_type == 'income':
                new_acc.current_balance += new_amount
            else:
                new_acc.current_balance -= new_amount

    db.session.commit()
    log_activity(current_user.id, f"Updated transaction #{tx_id}")
    emit_user_event(current_user.id, 'transaction.updated', tx_id)
    return jsonify(tx.to_dict())

# --- FINANCIAL REPORTS ENDPOINT ---
@app.route('/api/reports/generate', methods=['GET', 'POST'])
@token_required
def generate_financial_report_data(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        from_str = data.get('from_date')
        to_str = data.get('to_date')
        acc_filter = data.get('account_id')
        cat_filter = data.get('category')
        tx_type_filter = data.get('type')
    else:
        from_str = request.args.get('from_date')
        to_str = request.args.get('to_date')
        acc_filter = request.args.get('account_id')
        cat_filter = request.args.get('category')
        tx_type_filter = request.args.get('type')

    now = datetime.datetime.utcnow()
    if not from_str:
        from_dt = datetime.datetime(now.year, now.month, 1)
    else:
        try:
            from_dt = datetime.datetime.strptime(from_str.split('T')[0], '%Y-%m-%d')
        except Exception:
            from_dt = datetime.datetime(now.year, now.month, 1)

    if not to_str:
        to_dt = datetime.datetime(now.year, now.month, now.day, 23, 59, 59)
    else:
        try:
            to_dt = datetime.datetime.strptime(to_str.split('T')[0], '%Y-%m-%d').replace(hour=23, minute=59, second=59)
        except Exception:
            to_dt = now

    query = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= from_dt,
        Transaction.date <= to_dt
    )

    if acc_filter and str(acc_filter) != 'all':
        try:
            query = query.filter(Transaction.account_id == int(acc_filter))
        except Exception:
            pass

    if cat_filter and str(cat_filter) != 'all':
        query = query.filter(Transaction.category == str(cat_filter))

    if tx_type_filter and str(tx_type_filter) != 'all':
        query = query.filter(Transaction.type == str(tx_type_filter))

    transactions = query.order_by(Transaction.date.desc()).all()

    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expense = sum(t.amount for t in transactions if t.type == 'expense')
    net_cash_flow = total_income - total_expense
    savings_rate = round((net_cash_flow / total_income * 100), 1) if total_income > 0 else 0.0

    exp_categories = {}
    inc_categories = {}
    exp_accounts = {}
    inc_accounts = {}
    daily_spending = {}

    user_accounts = {a.id: a.name for a in Account.query.filter_by(user_id=current_user.id).all()}

    for t in transactions:
        acc_name = user_accounts.get(t.account_id, 'Unassigned')
        day_key = t.date.strftime('%Y-%m-%d') if t.date else 'Unknown'
        if t.type == 'expense':
            exp_categories[t.category] = exp_categories.get(t.category, 0.0) + t.amount
            exp_accounts[acc_name] = exp_accounts.get(acc_name, 0.0) + t.amount
            daily_spending[day_key] = daily_spending.get(day_key, 0.0) + t.amount
        elif t.type == 'income':
            inc_categories[t.category] = inc_categories.get(t.category, 0.0) + t.amount
            inc_accounts[acc_name] = inc_accounts.get(acc_name, 0.0) + t.amount

    expenses_list = [t.to_dict() for t in transactions if t.type == 'expense']
    top_expenses = sorted(expenses_list, key=lambda x: x['amount'], reverse=True)[:5]
    largest_tx = top_expenses[0] if top_expenses else None

    total_days = max(1, (to_dt - from_dt).days + 1)
    avg_daily_spending = round(total_expense / total_days, 2)
    avg_tx_value = round(total_expense / max(1, len(expenses_list)), 2)

    return jsonify({
        'from_date': from_dt.strftime('%Y-%m-%d'),
        'to_date': to_dt.strftime('%Y-%m-%d'),
        'summary': {
            'total_income': total_income,
            'total_expense': total_expense,
            'net_cash_flow': net_cash_flow,
            'savings_rate': savings_rate,
            'transaction_count': len(transactions),
            'avg_daily_spending': avg_daily_spending,
            'avg_transaction_value': avg_tx_value,
            'largest_transaction': largest_tx
        },
        'breakdowns': {
            'expense_by_category': exp_categories,
            'income_by_category': inc_categories,
            'expense_by_account': exp_accounts,
            'income_by_account': inc_accounts,
            'daily_spending': daily_spending,
            'top_expenses': top_expenses
        },
        'transactions': [t.to_dict() for t in transactions]
    })

@app.route('/api/ai/quick-questions', methods=['GET'])
@token_required
def get_ai_quick_questions_route(current_user):
    from services.ai_copilot import generate_dynamic_quick_questions
    questions = generate_dynamic_quick_questions(current_user.id)
    return jsonify({'questions': questions})

# --- BUDGETS API ---
@app.route('/api/budgets', methods=['GET', 'POST'])
@token_required
def manage_budgets(current_user):
    if request.method == 'GET':
        budgets = Budget.query.filter_by(user_id=current_user.id).all()
        return jsonify([b.to_dict() for b in budgets])

    data = request.get_json() or {}
    b = Budget(
        user_id=current_user.id,
        category=data.get('category', 'Overall'),
        amount=float(data.get('amount', 0)),
        period=data.get('period', 'monthly')
    )
    db.session.add(b)
    db.session.commit()
    emit_user_event(current_user.id, 'budget.created', b.id)
    return jsonify(b.to_dict())

@app.route('/api/budgets/<int:b_id>', methods=['DELETE'])
@token_required
def delete_budget(current_user, b_id):
    b = Budget.query.filter_by(id=b_id, user_id=current_user.id).first()
    if not b:
        return jsonify({'message': 'Budget not found'}), 404
    db.session.delete(b)
    db.session.commit()
    emit_user_event(current_user.id, 'budget.deleted', b_id)
    return jsonify({'success': True})

# --- SUBSCRIPTIONS & MARK AS PAID ---
@app.route('/api/subscriptions', methods=['GET', 'POST'])
@token_required
def manage_subscriptions(current_user):
    if request.method == 'GET':
        subs = Subscription.query.filter_by(user_id=current_user.id).all()
        return jsonify([s.to_dict() for s in subs])

    data = request.get_json() or {}
    sub = Subscription(
        user_id=current_user.id,
        title=data.get('title', 'Service'),
        amount=float(data.get('amount', 0)),
        due_date=data.get('dueDate', '15th of month'),
        category=data.get('category', 'Streaming')
    )
    db.session.add(sub)
    db.session.commit()
    emit_user_event(current_user.id, 'subscription.created', sub.id)
    return jsonify(sub.to_dict())

@app.route('/api/subscriptions/<int:sub_id>/toggle', methods=['PUT'])
@token_required
def toggle_subscription(current_user, sub_id):
    sub = Subscription.query.filter_by(id=sub_id, user_id=current_user.id).first()
    if not sub:
        return jsonify({'message': 'Subscription not found'}), 404
    
    sub.is_paid = not sub.is_paid
    if sub.is_paid:
        tx = Transaction(
            user_id=current_user.id,
            type='expense',
            amount=sub.amount,
            category=sub.category,
            description=f"Paid Subscription: {sub.title}",
            date=datetime.date.today().isoformat()
        )
        db.session.add(tx)
        log_activity(current_user.id, f"Marked subscription '{sub.title}' as paid (₹{sub.amount})")

    db.session.commit()
    emit_user_event(current_user.id, 'subscription.updated', sub_id)
    return jsonify(sub.to_dict())

@app.route('/api/subscriptions/<int:sub_id>', methods=['DELETE'])
@token_required
def delete_subscription(current_user, sub_id):
    sub = Subscription.query.filter_by(id=sub_id, user_id=current_user.id).first()
    if not sub:
        return jsonify({'message': 'Subscription not found'}), 404
    db.session.delete(sub)
    db.session.commit()
    log_activity(current_user.id, f"Deleted subscription #{sub_id}")
    emit_user_event(current_user.id, 'subscription.deleted', sub_id)
    return jsonify({'success': True})

@app.route('/api/subscriptions/detect', methods=['GET'])
@token_required
def detect_subs(current_user):
    txs = Transaction.query.filter_by(user_id=current_user.id).all()
    subs = Subscription.query.filter_by(user_id=current_user.id).all()
    suggestions = detect_recurring_subscriptions(txs, subs)
    return jsonify(suggestions)

# --- SAVINGS GOALS API ---
@app.route('/api/goals', methods=['GET', 'POST'])
@token_required
def manage_goals(current_user):
    if request.method == 'GET':
        goals = SavingsGoal.query.filter_by(user_id=current_user.id).all()
        return jsonify([g.to_dict() for g in goals])

    data = request.get_json() or {}
    goal = SavingsGoal(
        user_id=current_user.id,
        title=data.get('title', 'Goal'),
        target_amount=float(data.get('targetAmount', 0)),
        current_amount=float(data.get('currentAmount', 0)),
        target_date=data.get('targetDate', '')
    )
    db.session.add(goal)
    db.session.commit()
    emit_user_event(current_user.id, 'goal.created', goal.id)
    return jsonify(goal.to_dict())

@app.route('/api/goals/<int:goal_id>', methods=['PUT', 'DELETE'])
@token_required
def modify_goal(current_user, goal_id):
    goal = SavingsGoal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({'message': 'Savings goal not found'}), 404

    if request.method == 'DELETE':
        db.session.delete(goal)
        db.session.commit()
        emit_user_event(current_user.id, 'goal.deleted', goal_id)
        return jsonify({'success': True})

    data = request.get_json() or {}
    if 'current_amount' in data:
        goal.current_amount = float(data['current_amount'])
    if 'add_deposit' in data:
        deposit = float(data['add_deposit'])
        goal.current_amount += deposit
        tx = Transaction(
            user_id=current_user.id,
            type='expense',
            amount=deposit,
            category='Savings',
            description=f"Savings Goal Deposit: {goal.title}",
            date=datetime.date.today().isoformat()
        )
        db.session.add(tx)
        log_activity(current_user.id, f"Deposited ₹{deposit} into savings goal '{goal.title}'")

    db.session.commit()
    emit_user_event(current_user.id, 'goal.updated', goal_id)
    return jsonify(goal.to_dict())

# --- REPORT TEMPLATES API ---
@app.route('/api/report-templates', methods=['GET', 'POST'])
@token_required
def manage_report_templates(current_user):
    if request.method == 'GET':
        templates = ReportTemplate.query.filter_by(user_id=current_user.id).order_by(ReportTemplate.id.desc()).all()
        return jsonify([t.to_dict() for t in templates])

    data = request.get_json() or {}
    cats = data.get('categories', [])
    cat_str = ','.join(cats) if isinstance(cats, list) else str(cats)
    tmpl = ReportTemplate(
        user_id=current_user.id,
        title=data.get('title', 'Custom Report'),
        date_range=data.get('dateRange', 'this_month'),
        categories=cat_str,
        type=data.get('type', 'all')
    )
    db.session.add(tmpl)
    db.session.commit()
    log_activity(current_user.id, f"Saved report template '{tmpl.title}'")
    return jsonify(tmpl.to_dict())

@app.route('/api/report-templates/<int:tmpl_id>', methods=['DELETE'])
@token_required
def delete_report_template(current_user, tmpl_id):
    tmpl = ReportTemplate.query.filter_by(id=tmpl_id, user_id=current_user.id).first()
    if not tmpl:
        return jsonify({'message': 'Report template not found'}), 404
    db.session.delete(tmpl)
    db.session.commit()
    return jsonify({'success': True})

# --- NOTIFICATIONS API ---
@app.route('/api/notifications', methods=['GET', 'POST'])
@token_required
def manage_notifications(current_user):
    if request.method == 'GET':
        notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.id.desc()).limit(30).all()
        return jsonify([n.to_dict() for n in notifs])

    data = request.get_json() or {}
    notif = Notification(
        user_id=current_user.id,
        type=data.get('type', 'info'),
        title=data.get('title', 'Notification'),
        message=data.get('message', ''),
        severity=data.get('severity', 'info')
    )
    db.session.add(notif)
    db.session.commit()
    emit_user_event(current_user.id, 'notification.created', notif.id)
    return jsonify(notif.to_dict())

@app.route('/api/notifications/mark-read', methods=['PUT'])
@token_required
def mark_notifications_read(current_user):
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({Notification.is_read: True})
    db.session.commit()
    emit_user_event(current_user.id, 'notification.read')
    return jsonify({'success': True})

# --- NET WORTH (ASSETS & LIABILITIES) API ---
@app.route('/api/net-worth', methods=['GET'])
@token_required
def get_net_worth(current_user):
    assets = Asset.query.filter_by(user_id=current_user.id).all()
    liabilities = Liability.query.filter_by(user_id=current_user.id).all()
    accounts = Account.query.filter_by(user_id=current_user.id).all()

    tot_assets = sum(a.value for a in assets) + sum(max(0, acc.current_balance) for acc in accounts)
    tot_liab = sum(l.amount for l in liabilities) + sum(abs(acc.current_balance) for acc in accounts if acc.current_balance < 0)

    return jsonify({
        'net_worth': tot_assets - tot_liab,
        'total_assets': tot_assets,
        'total_liabilities': tot_liab,
        'assets': [a.to_dict() for a in assets],
        'liabilities': [l.to_dict() for l in liabilities]
    })

@app.route('/api/assets', methods=['POST'])
@token_required
def add_asset(current_user):
    data = request.get_json() or {}
    a = Asset(user_id=current_user.id, name=data.get('name'), category=data.get('category', 'Bank'), value=float(data.get('value', 0)))
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict())

@app.route('/api/liabilities', methods=['POST'])
@token_required
def add_liability(current_user):
    data = request.get_json() or {}
    l = Liability(
        user_id=current_user.id,
        name=data.get('name'),
        category=data.get('category', 'Credit Card'),
        amount=float(data.get('amount', 0)),
        interest_rate=float(data.get('interest_rate', 0)),
        minimum_payment=float(data.get('minimum_payment', 0)),
        due_date=data.get('due_date', '')
    )
    db.session.add(l)
    db.session.commit()
    return jsonify(l.to_dict())

# --- AI COPILOT & QUICK ADD API ---
@app.route('/api/ai/chat', methods=['POST'])
@token_required
def ai_chat(current_user):
    data = request.get_json() or {}
    query = data.get('query', '')

    txs = Transaction.query.filter_by(user_id=current_user.id).all()
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    subs = Subscription.query.filter_by(user_id=current_user.id).all()
    goals = SavingsGoal.query.filter_by(user_id=current_user.id).all()
    accounts = Account.query.filter_by(user_id=current_user.id).all()

    reply = answer_financial_copilot(query, txs, budgets, subs, goals, accounts)
    return jsonify(reply if isinstance(reply, dict) else {'reply': reply})

@app.route('/api/ai/confirm-action', methods=['POST'])
@token_required
def confirm_ai_action(current_user):
    data = request.get_json() or {}
    proposal = data.get('proposal', {})
    p_type = proposal.get('type')

    if p_type == 'add_transaction':
        tx = Transaction(
            user_id=current_user.id,
            type='expense',
            amount=float(proposal.get('amount', 0)),
            category=proposal.get('category', 'Food'),
            description=proposal.get('description', 'AI Copilot Expense'),
            date=datetime.date.today().isoformat()
        )
        db.session.add(tx)
    elif p_type == 'create_goal':
        goal = SavingsGoal(
            user_id=current_user.id,
            title=proposal.get('title', 'AI Goal'),
            target_amount=float(proposal.get('targetAmount', 10000)),
            current_amount=0
        )
        db.session.add(goal)
    elif p_type == 'set_budget':
        b = Budget(
            user_id=current_user.id,
            category=proposal.get('category', 'Food'),
            amount=float(proposal.get('amount', 5000))
        )
        db.session.add(b)

    db.session.commit()
    log_activity(current_user.id, f"Executed confirmed AI Action: {p_type}")
    return jsonify({'success': True, 'message': 'AI Action executed successfully.'})

@app.route('/api/ai/quick-add', methods=['POST'])
@token_required
def quick_add(current_user):
    data = request.get_json() or {}
    text = data.get('text', '')
    parsed = parse_quick_add(text)
    return jsonify(parsed)

@app.route('/api/import/csv', methods=['POST'])
@token_required
def import_csv(current_user):
    data = request.get_json() or {}
    records = data.get('records', [])

    imported_count = 0
    for r in records:
        tx = Transaction(
            user_id=current_user.id,
            type=r.get('type', 'expense'),
            amount=float(r.get('amount', 0)),
            category=r.get('category', 'Other'),
            description=r.get('description', 'CSV Import'),
            date=r.get('date', datetime.date.today().isoformat())
        )
        db.session.add(tx)
        imported_count += 1

    db.session.commit()
    log_activity(current_user.id, f"Imported {imported_count} transactions from CSV")
    return jsonify({'success': True, 'imported_count': imported_count})

@app.route('/api/activity-logs', methods=['GET'])
@token_required
def get_activity_logs(current_user):
    logs = ActivityLog.query.filter_by(user_id=current_user.id).order_by(ActivityLog.id.desc()).limit(20).all()
    return jsonify([l.to_dict() for l in logs])

@app.route('/api/demo-data', methods=['POST'])
@token_required
def load_demo(current_user):
    sample_txs = [
        Transaction(user_id=current_user.id, type='income', amount=85000, category='Salary', date='2026-08-01', description='Tech Monthly Salary'),
        Transaction(user_id=current_user.id, type='expense', amount=15500, category='Utilities', date='2026-08-02', description='Rent & Power Bill'),
        Transaction(user_id=current_user.id, type='expense', amount=4200, category='Food', date='2026-08-03', description='Supermarket Groceries'),
        Transaction(user_id=current_user.id, type='expense', amount=1200, category='Entertainment', date='2026-08-04', description='Cinema Tickets'),
        Transaction(user_id=current_user.id, type='income', amount=12500, category='Investment', date='2026-08-05', description='Stock Dividends')
    ]
    sample_budgets = [
        Budget(user_id=current_user.id, category='Food', amount=10000, period='monthly'),
        Budget(user_id=current_user.id, category='Transport', amount=5000, period='monthly')
    ]
    db.session.add_all(sample_txs + sample_budgets)
    db.session.commit()
    log_activity(current_user.id, 'Loaded sample demo financial data')
    return jsonify({'success': True})

# --- PROTECTED ADMIN ENDPOINTS ---
@app.route('/api/admin/ai/chat', methods=['POST'])
@token_required
@admin_required
def admin_ai_chat(current_user):
    data = request.get_json() or {}
    query = data.get('query', '')
    reply = answer_admin_copilot(query, current_user.id)
    return jsonify(reply if isinstance(reply, dict) else {'reply': reply})

@app.route('/api/admin/dashboard-summary', methods=['GET'])
@app.route('/api/admin/database-summary', methods=['GET'])
@token_required
@admin_required
def admin_dashboard_summary(current_user):
    stats = get_admin_stats()
    log_activity(current_user.id, "Admin viewed Dashboard Summary")
    return jsonify(stats)

@app.route('/api/admin/system-health', methods=['GET'])
@app.route('/api/admin/database-health', methods=['GET'])
@token_required
@admin_required
def admin_system_health(current_user):
    required_tables = ['users', 'accounts', 'transactions', 'budgets', 'subscriptions', 'savings_goals', 'report_templates', 'notifications', 'activity_logs']
    existing_tables = []
    record_counts = {}
    is_healthy = True

    t0 = time.perf_counter()
    with db.engine.connect() as conn:
        rows = conn.execute(db.text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")).fetchall()
        existing_tables = [r[0] for r in rows]

        for tbl in required_tables:
            if tbl not in existing_tables:
                is_healthy = False
            else:
                cnt = conn.execute(db.text(f"SELECT COUNT(*) FROM `{tbl}`")).fetchone()
                record_counts[tbl] = cnt[0] if cnt else 0

    query_latency_ms = round((time.perf_counter() - t0) * 1000, 2)

    return jsonify({
        'status': 'healthy' if is_healthy else 'unhealthy',
        'database': {
            'status': 'healthy' if is_healthy else 'unhealthy',
            'engine': 'SQLite3',
            'path': 'backend/finai.db',
            'tables': len(existing_tables),
            'query_latency_ms': query_latency_ms
        },
        'api': 'healthy',
        'authentication': 'healthy',
        'ai': 'healthy',
        'ocr': 'healthy',
        'required_tables_present': is_healthy,
        'record_counts': record_counts,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/admin/users', methods=['GET'])
@token_required
@admin_required
def admin_list_users(current_user):
    search = request.args.get('search', '').strip().lower()
    role_filter = request.args.get('role', '').strip().lower()
    status_filter = request.args.get('status', '').strip().lower()
    sort_by = request.args.get('sort_by', 'newest')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = User.query

    if search:
        query = query.filter(
            db.or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.id.cast(db.String).ilike(f"%{search}%")
            )
        )

    if role_filter and role_filter in ['user', 'admin']:
        query = query.filter(User.role == role_filter)

    if status_filter in ['active', 'inactive']:
        is_act = (status_filter == 'active')
        query = query.filter(User.is_active == is_act)

    if sort_by == 'oldest':
        query = query.order_by(User.id.asc())
    else:
        query = query.order_by(User.id.desc())

    total_count = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()

    users_data = []
    for u in users:
        d = u.to_dict()
        d['account_count'] = Account.query.filter_by(user_id=u.id).count()
        d['transaction_count'] = Transaction.query.filter_by(user_id=u.id).count()
        d['budget_count'] = Budget.query.filter_by(user_id=u.id).count()
        d['goal_count'] = SavingsGoal.query.filter_by(user_id=u.id).count()
        d['subscription_count'] = Subscription.query.filter_by(user_id=u.id).count()
        
        total_spent = db.session.query(db.func.sum(Transaction.amount)).filter_by(user_id=u.id, type='expense').scalar() or 0.0
        total_income = db.session.query(db.func.sum(Transaction.amount)).filter_by(user_id=u.id, type='income').scalar() or 0.0
        d['total_spent'] = round(total_spent, 2)
        d['total_income'] = round(total_income, 2)
        users_data.append(d)

    if sort_by == 'most_transactions':
        users_data.sort(key=lambda x: x['transaction_count'], reverse=True)
    elif sort_by == 'highest_spending':
        users_data.sort(key=lambda x: x['total_spent'], reverse=True)
    elif sort_by == 'highest_income':
        users_data.sort(key=lambda x: x['total_income'], reverse=True)

    log_activity(current_user.id, "Admin viewed User Management list")
    return jsonify({
        'users': users_data,
        'total': total_count,
        'page': page,
        'per_page': per_page
    })

@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def admin_get_user_details(current_user, user_id):
    u = db.session.get(User, user_id)
    if not u:
        return jsonify({'message': 'User not found'}), 404
    
    user_dict = u.to_dict()
    
    accounts = Account.query.filter_by(user_id=u.id).all()
    transactions = Transaction.query.filter_by(user_id=u.id).order_by(Transaction.id.desc()).all()
    budgets = Budget.query.filter_by(user_id=u.id).all()
    goals = SavingsGoal.query.filter_by(user_id=u.id).all()
    subscriptions = Subscription.query.filter_by(user_id=u.id).all()
    assets = Asset.query.filter_by(user_id=u.id).all()
    liabilities = Liability.query.filter_by(user_id=u.id).all()
    logs = ActivityLog.query.filter_by(user_id=u.id).order_by(ActivityLog.id.desc()).limit(50).all()

    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expense = sum(t.amount for t in transactions if t.type == 'expense')
    net_cashflow = total_income - total_expense

    total_assets = sum(a.value for a in assets)
    total_liabilities = sum(l.amount for l in liabilities)
    account_balances = sum(a.current_balance or 0 for a in accounts)
    net_worth = total_assets + account_balances - total_liabilities

    return jsonify({
        'user': user_dict,
        'summary': {
            'total_income': round(total_income, 2),
            'total_expenses': round(total_expense, 2),
            'net_cashflow': round(net_cashflow, 2),
            'total_accounts': len(accounts),
            'total_transactions': len(transactions),
            'total_budgets': len(budgets),
            'total_goals': len(goals),
            'total_subscriptions': len(subscriptions),
            'total_assets': len(assets),
            'total_liabilities': len(liabilities),
            'net_worth': round(net_worth, 2)
        },
        'accounts': [a.to_dict() for a in accounts],
        'transactions': [t.to_dict() for t in transactions],
        'budgets': [b.to_dict() for b in budgets],
        'goals': [g.to_dict() for g in goals],
        'subscriptions': [s.to_dict() for s in subscriptions],
        'assets': [a.to_dict() for a in assets],
        'liabilities': [l.to_dict() for l in liabilities],
        'activity': [l.to_dict() for l in logs]
    })

@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
@token_required
@admin_required
def admin_toggle_user_status(current_user, user_id):
    u = db.session.get(User, user_id)
    if not u:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json() or {}
    if 'is_active' in data:
        u.is_active = bool(data['is_active'])
    if 'role' in data and data['role'] in ['user', 'admin']:
        u.role = data['role']

    db.session.commit()
    action_text = f"Admin updated User #{u.id} ({u.email}) status: active={u.is_active}, role={u.role}"
    log_activity(current_user.id, action_text)
    emit_user_event(u.id, 'user.updated')
    return jsonify(u.to_dict())

@app.route('/api/admin/analytics', methods=['GET'])
@token_required
@admin_required
def admin_analytics(current_user):
    period = request.args.get('period', '30days')
    
    # User growth
    users = User.query.order_by(User.created_at.asc()).all()
    user_growth_map = {}
    for u in users:
        date_str = u.created_at.strftime("%Y-%m-%d") if u.created_at else datetime.date.today().isoformat()
        user_growth_map[date_str] = user_growth_map.get(date_str, 0) + 1

    cumulative = 0
    user_growth = []
    for d_str, count in sorted(user_growth_map.items()):
        cumulative += count
        user_growth.append({'date': d_str, 'new_users': count, 'total': cumulative})

    # Transaction volume & Income vs Expense
    txs = Transaction.query.order_by(Transaction.date.asc()).all()
    tx_vol_map = {}
    cat_spent_map = {}
    user_spent_map = {}

    total_inc = 0.0
    total_exp = 0.0

    for t in txs:
        d_str = t.date or datetime.date.today().isoformat()
        if d_str not in tx_vol_map:
            tx_vol_map[d_str] = {'income': 0.0, 'expense': 0.0, 'count': 0}
        
        tx_vol_map[d_str]['count'] += 1

        if t.type == 'income':
            tx_vol_map[d_str]['income'] += t.amount
            total_inc += t.amount
        else:
            tx_vol_map[d_str]['expense'] += t.amount
            total_exp += t.amount
            cat_spent_map[t.category] = cat_spent_map.get(t.category, 0.0) + t.amount
            user_spent_map[t.user_id] = user_spent_map.get(t.user_id, 0.0) + t.amount

    transaction_volume = [{'date': d, 'income': round(v['income'], 2), 'expense': round(v['expense'], 2), 'count': v['count']} for d, v in sorted(tx_vol_map.items())]

    top_categories = [{'category': k, 'amount': round(v, 2)} for k, v in sorted(cat_spent_map.items(), key=lambda x: x[1], reverse=True)]

    top_spending_users = []
    for uid, spent in sorted(user_spent_map.items(), key=lambda x: x[1], reverse=True)[:5]:
        u_obj = db.session.get(User, uid)
        if u_obj:
            top_spending_users.append({
                'user_id': uid,
                'name': u_obj.name,
                'email': u_obj.email,
                'total_spent': round(spent, 2)
            })

    summary = get_admin_stats()
    record_distribution = [{'table': k, 'count': v} for k, v in summary.items() if isinstance(v, int)]

    return jsonify({
        'user_growth': user_growth,
        'transaction_volume': transaction_volume,
        'income_vs_expense': {
            'total_income': round(total_inc, 2),
            'total_expenses': round(total_exp, 2),
            'net_cashflow': round(total_inc - total_exp, 2)
        },
        'top_categories': top_categories,
        'top_spending_users': top_spending_users,
        'record_distribution': record_distribution
    })

@app.route('/api/admin/tables', methods=['GET'])
@token_required
@admin_required
def admin_list_tables(current_user):
    tables_info = []
    with db.engine.connect() as conn:
        rows = conn.execute(db.text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")).fetchall()
        table_names = [r[0] for r in rows]

        for tbl in table_names:
            cnt_res = conn.execute(db.text(f"SELECT COUNT(*) FROM `{tbl}`")).fetchone()
            cnt = cnt_res[0] if cnt_res else 0
            cols_res = conn.execute(db.text(f"PRAGMA table_info(`{tbl}`)")).fetchall()
            cols = [c[1] for c in cols_res]
            tables_info.append({
                'name': tbl,
                'count': cnt,
                'columns': cols,
                'column_count': len(cols)
            })

    return jsonify(tables_info)

@app.route('/api/admin/tables/<table_name>', methods=['GET'])
@token_required
@admin_required
def admin_get_table_detail(current_user, table_name):
    with db.engine.connect() as conn:
        rows = conn.execute(db.text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")).fetchall()
        existing_tables = [r[0] for r in rows]

        if table_name not in existing_tables:
            return jsonify({'message': 'Table not found'}), 404

        cols_res = conn.execute(db.text(f"PRAGMA table_info(`{table_name}`)")).fetchall()
        columns = [{'name': c[1], 'type': c[2], 'notnull': bool(c[3]), 'pk': bool(c[5])} for c in cols_res]

        cnt_res = conn.execute(db.text(f"SELECT COUNT(*) FROM `{table_name}`")).fetchone()
        count = cnt_res[0] if cnt_res else 0

        recent_rows_res = conn.execute(db.text(f"SELECT * FROM `{table_name}` ORDER BY id DESC LIMIT 10")).fetchall()
        col_names = [c['name'] for c in columns]

        sensitive_keys = {'password_hash', 'google_sub', 'jwt_secret', 'api_key', 'secret', 'token'}

        safe_records = []
        for row in recent_rows_res:
            row_dict = {}
            for idx, name in enumerate(col_names):
                val = row[idx]
                if name in sensitive_keys and val:
                    row_dict[name] = '[REDACTED]'
                else:
                    row_dict[name] = val
            safe_records.append(row_dict)

        return jsonify({
            'table_name': table_name,
            'columns': columns,
            'count': count,
            'recent_records': safe_records
        })

@app.route('/api/admin/activity-logs', methods=['GET'])
@token_required
@admin_required
def admin_list_activity_logs(current_user):
    search = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = ActivityLog.query
    if search:
        query = query.filter(
            db.or_(
                ActivityLog.action.ilike(f"%{search}%"),
                ActivityLog.user_id.cast(db.String).ilike(f"%{search}%")
            )
        )

    total = query.count()
    logs = query.order_by(ActivityLog.id.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'logs': [l.to_dict() for l in logs],
        'total': total,
        'page': page,
        'per_page': per_page
    })

@app.route('/api/admin/accounts', methods=['GET'])
@token_required
@admin_required
def admin_list_accounts(current_user):
    search = request.args.get('search', '').strip().lower()
    type_filter = request.args.get('type', '').strip()
    status_filter = request.args.get('status', '').strip()
    user_id_param = request.args.get('user_id', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = Account.query

    if user_id_param and user_id_param.isdigit():
        query = query.filter(Account.user_id == int(user_id_param))

    if type_filter:
        query = query.filter(Account.type.ilike(f"%{type_filter}%"))

    if status_filter in ['active', 'inactive']:
        is_act = (status_filter == 'active')
        query = query.filter(Account.is_active == is_act)

    if search:
        query = query.join(User, Account.user_id == User.id).filter(
            db.or_(
                Account.name.ilike(f"%{search}%"),
                Account.notes.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )

    total = query.count()
    accounts = query.order_by(Account.id.desc()).offset((page - 1) * per_page).limit(per_page).all()

    accounts_data = []
    for a in accounts:
        d = a.to_dict()
        u = db.session.get(User, a.user_id)
        d['user_name'] = u.name if u else f"User #{a.user_id}"
        d['user_email'] = u.email if u else "N/A"
        accounts_data.append(d)

    return jsonify({
        'accounts': accounts_data,
        'total': total,
        'page': page,
        'per_page': per_page
    })

@app.route('/api/admin/transactions', methods=['GET'])
@token_required
@admin_required
def admin_list_transactions(current_user):
    search = request.args.get('search', '').strip().lower()
    type_filter = request.args.get('type', '').strip().lower()
    category_filter = request.args.get('category', '').strip()
    user_id_param = request.args.get('user_id', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = Transaction.query

    if user_id_param and user_id_param.isdigit():
        query = query.filter(Transaction.user_id == int(user_id_param))

    if type_filter in ['income', 'expense']:
        query = query.filter(Transaction.type == type_filter)

    if category_filter:
        query = query.filter(Transaction.category.ilike(f"%{category_filter}%"))

    if start_date:
        query = query.filter(Transaction.date >= start_date)

    if end_date:
        query = query.filter(Transaction.date <= end_date)

    if search:
        query = query.join(User, Transaction.user_id == User.id).filter(
            db.or_(
                Transaction.description.ilike(f"%{search}%"),
                Transaction.merchant.ilike(f"%{search}%"),
                Transaction.category.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )

    total = query.count()
    txs = query.order_by(Transaction.id.desc()).offset((page - 1) * per_page).limit(per_page).all()

    tx_data = []
    for t in txs:
        d = t.to_dict()
        u = db.session.get(User, t.user_id)
        d['user_name'] = u.name if u else f"User #{t.user_id}"
        d['user_email'] = u.email if u else "N/A"
        tx_data.append(d)

    return jsonify({
        'transactions': tx_data,
        'total': total,
        'page': page,
        'per_page': per_page
    })

@app.route('/api/admin/savings-goals', methods=['GET'])
@token_required
@admin_required
def admin_list_savings_goals(current_user):
    search = request.args.get('search', '').strip().lower()
    status_filter = request.args.get('status', '').strip().lower()
    user_id_param = request.args.get('user_id', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = SavingsGoal.query

    if user_id_param and user_id_param.isdigit():
        query = query.filter(SavingsGoal.user_id == int(user_id_param))

    if search:
        query = query.join(User, SavingsGoal.user_id == User.id).filter(
            db.or_(
                SavingsGoal.title.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )

    all_goals = query.order_by(SavingsGoal.id.desc()).all()
    today_str = datetime.date.today().isoformat()

    processed = []
    total_target = 0.0
    total_saved = 0.0
    completed_cnt = 0
    active_cnt = 0
    overdue_cnt = 0

    for g in all_goals:
        target = float(g.target_amount or 0.0)
        current = float(g.current_amount or 0.0)
        remaining = max(round(target - current, 2), 0.0)
        progress = round((current / target * 100), 1) if target > 0 else 0.0
        progress = min(progress, 100.0)

        is_completed = (current >= target and target > 0)
        is_overdue = (not is_completed and g.target_date and g.target_date < today_str)

        if is_completed:
            status_str = 'completed'
            completed_cnt += 1
        elif is_overdue:
            status_str = 'overdue'
            overdue_cnt += 1
        else:
            status_str = 'active'
            active_cnt += 1

        if status_filter and status_filter != status_str:
            continue

        total_target += target
        total_saved += current

        d = g.to_dict()
        u = db.session.get(User, g.user_id)
        d['user_name'] = u.name if u else f"User #{g.user_id}"
        d['user_email'] = u.email if u else "N/A"
        d['remaining_amount'] = remaining
        d['progress_percentage'] = progress
        d['status'] = status_str
        processed.append(d)

    total_matching = len(processed)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated = processed[start_idx:end_idx]

    return jsonify({
        'savings_goals': paginated,
        'summary': {
            'total_goals': len(all_goals),
            'total_target_amount': round(total_target, 2),
            'total_saved_amount': round(total_saved, 2),
            'completed_count': completed_cnt,
            'active_count': active_cnt,
            'overdue_count': overdue_cnt,
            'overall_progress': round((total_saved / total_target * 100), 1) if total_target > 0 else 0.0
        },
        'total': total_matching,
        'page': page,
        'per_page': per_page
    })

@app.route('/api/admin/budgets', methods=['GET'])
@token_required
@admin_required
def admin_list_budgets(current_user):
    search = request.args.get('search', '').strip().lower()
    period_filter = request.args.get('period', '').strip().lower()
    user_id_param = request.args.get('user_id', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = Budget.query

    if user_id_param and user_id_param.isdigit():
        query = query.filter(Budget.user_id == int(user_id_param))

    if period_filter:
        query = query.filter(Budget.period == period_filter)

    if search:
        query = query.join(User, Budget.user_id == User.id).filter(
            db.or_(
                Budget.category.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )

    all_budgets = query.order_by(Budget.id.desc()).all()

    processed = []
    total_allocated = 0.0
    total_spent = 0.0
    exceeded_cnt = 0
    warning_cnt = 0
    ontrack_cnt = 0

    for b in all_budgets:
        allocated = float(b.amount or 0.0)
        spent_query = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.user_id == b.user_id,
            Transaction.category.ilike(b.category),
            Transaction.type == 'expense'
        ).scalar() or 0.0

        used = float(spent_query)
        remaining = round(allocated - used, 2)
        usage_pct = round((used / allocated * 100), 1) if allocated > 0 else 0.0

        if used > allocated:
            status_str = 'exceeded'
            exceeded_cnt += 1
        elif usage_pct >= 80.0:
            status_str = 'warning'
            warning_cnt += 1
        else:
            status_str = 'on_track'
            ontrack_cnt += 1

        total_allocated += allocated
        total_spent += used

        d = b.to_dict()
        u = db.session.get(User, b.user_id)
        d['user_name'] = u.name if u else f"User #{b.user_id}"
        d['user_email'] = u.email if u else "N/A"
        d['used_amount'] = round(used, 2)
        d['remaining_amount'] = remaining
        d['usage_percentage'] = usage_pct
        d['status'] = status_str
        processed.append(d)

    total_matching = len(processed)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated = processed[start_idx:end_idx]

    return jsonify({
        'budgets': paginated,
        'summary': {
            'total_budgets': len(all_budgets),
            'total_allocated': round(total_allocated, 2),
            'total_spent': round(total_spent, 2),
            'exceeded_count': exceeded_cnt,
            'warning_count': warning_cnt,
            'ontrack_count': ontrack_cnt
        },
        'total': total_matching,
        'page': page,
        'per_page': per_page
    })

@app.route('/api/admin/search', methods=['GET'])
@token_required
@admin_required
def admin_global_search(current_user):
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2:
        return jsonify({'users': [], 'accounts': [], 'transactions': [], 'savings_goals': [], 'budgets': []})

    term = f"%{q}%"

    users = User.query.filter(db.or_(User.name.ilike(term), User.email.ilike(term))).limit(5).all()
    accounts = Account.query.filter(db.or_(Account.name.ilike(term), Account.type.ilike(term))).limit(5).all()
    txs = Transaction.query.filter(db.or_(Transaction.category.ilike(term), Transaction.description.ilike(term), Transaction.merchant.ilike(term))).limit(5).all()
    goals = SavingsGoal.query.filter(SavingsGoal.title.ilike(term)).limit(5).all()
    budgets = Budget.query.filter(Budget.category.ilike(term)).limit(5).all()

    return jsonify({
        'users': [u.to_dict() for u in users],
        'accounts': [a.to_dict() for a in accounts],
        'transactions': [t.to_dict() for t in txs],
        'savings_goals': [g.to_dict() for g in goals],
        'budgets': [b.to_dict() for b in budgets]
    })

@app.route('/api/admin/reports/<report_type>', methods=['GET'])
@token_required
@admin_required
def admin_download_report(current_user, report_type):
    from flask import send_file
    from services.admin_reports import generate_financial_report_chart, generate_user_growth_report_chart, generate_category_spending_report_chart

    if report_type == 'financial':
        buf = generate_financial_report_chart()
        filename = 'finai_financial_cashflow_report.png'
    elif report_type == 'users':
        buf = generate_user_growth_report_chart()
        filename = 'finai_user_growth_report.png'
    elif report_type == 'transactions' or report_type == 'categories':
        buf = generate_category_spending_report_chart()
        filename = 'finai_category_spending_report.png'
    else:
        return jsonify({'message': 'Report type not found'}), 404

    log_activity(current_user.id, f"Admin downloaded Matplotlib report: {report_type}")
    return send_file(buf, mimetype='image/png', as_attachment=True, download_name=filename)

@app.route('/api/admin/change-password', methods=['POST'])
@token_required
@admin_required
def admin_change_password(current_user):
    data = request.get_json() or {}
    current_password = data.get('current_password', '').strip()
    new_password = data.get('new_password', '').strip()

    if not current_password or not new_password:
        return jsonify({'message': 'Current password and new password are required'}), 400

    if len(new_password) < 6:
        return jsonify({'message': 'New password must be at least 6 characters long'}), 400

    if current_user.password_hash and not check_password_hash(current_user.password_hash, current_password):
        return jsonify({'message': 'Incorrect current password'}), 400

    current_user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    log_activity(current_user.id, "Admin successfully changed account password")
    return jsonify({'success': True, 'message': 'Password updated successfully'})

@app.route('/api/admin/backup-db', methods=['POST'])
@token_required
@admin_required
def admin_trigger_backup(current_user):
    from backup_db import backup_database
    backup_path = backup_database()
    log_activity(current_user.id, "Admin executed Database Backup")
    return jsonify({'success': True, 'backup_path': os.path.basename(backup_path)})

if __name__ == '__main__':
    is_debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    socketio.run(app, port=5000, debug=is_debug, allow_unsafe_werkzeug=True)
