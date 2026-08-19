import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    google_sub = db.Column(db.String(120), unique=True, nullable=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    picture = db.Column(db.String(255), nullable=True)
    auth_provider = db.Column(db.String(50), default='email')
    role = db.Column(db.String(20), default='user')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'google_sub': self.google_sub,
            'name': self.name,
            'email': self.email,
            'picture': self.picture,
            'auth_provider': self.auth_provider,
            'role': self.role or 'user',
            'is_active': self.is_active if self.is_active is not None else True,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Account(db.Model):
    __tablename__ = 'accounts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(50), nullable=False, default='Bank') # Bank, Savings, Cash, Credit Card, Debit Card, UPI, Wallet, Investment, Loan, Other
    institution_name = db.Column(db.String(120), nullable=True)
    last_four = db.Column(db.String(10), nullable=True)
    color = db.Column(db.String(20), nullable=True, default='#3B82F6')
    icon = db.Column(db.String(50), nullable=True, default='wallet')
    opening_balance = db.Column(db.Float, default=0.0)
    current_balance = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='INR')
    notes = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_archived = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        tx_count = Transaction.query.filter_by(account_id=self.id, user_id=self.user_id).count()
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'name': self.name,
            'type': self.type,
            'institution_name': self.institution_name,
            'last_four': self.last_four,
            'color': self.color or '#3B82F6',
            'icon': self.icon or 'wallet',
            'opening_balance': self.opening_balance,
            'current_balance': self.current_balance,
            'currency': self.currency,
            'notes': self.notes,
            'is_active': self.is_active if self.is_active is not None else True,
            'is_archived': bool(self.is_archived),
            'transaction_count': tx_count,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    __table_args__ = (
        db.Index('idx_tx_user_date', 'user_id', 'date'),
        db.Index('idx_tx_user_cat', 'user_id', 'category'),
        db.Index('idx_tx_user_type', 'user_id', 'type'),
    )
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=True, index=True)
    type = db.Column(db.String(20), nullable=False, default='expense')
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='INR')
    category = db.Column(db.String(100), nullable=False, index=True)
    subcategory = db.Column(db.String(100), nullable=True)
    merchant = db.Column(db.String(120), nullable=True)
    payment_method = db.Column(db.String(50), default='Cash')
    date = db.Column(db.String(20), nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.String(255), nullable=True)
    tags = db.Column(db.String(255), nullable=True)
    receipt_ref = db.Column(db.String(255), nullable=True)
    recurring_flag = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'account_id': str(self.account_id) if self.account_id else None,
            'type': self.type,
            'amount': self.amount,
            'currency': self.currency,
            'category': self.category,
            'subcategory': self.subcategory,
            'merchant': self.merchant,
            'payment_method': self.payment_method,
            'date': self.date,
            'description': self.description,
            'notes': self.notes,
            'tags': self.tags,
            'receipt_ref': self.receipt_ref,
            'recurring_flag': self.recurring_flag
        }

class Budget(db.Model):
    __tablename__ = 'budgets'
    __table_args__ = (
        db.Index('idx_budget_user_cat', 'user_id', 'category'),
    )
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), default='monthly')

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'category': self.category,
            'amount': self.amount,
            'period': self.period
        }

class Bill(db.Model):
    __tablename__ = 'bills'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.String(50), default='monthly')
    status = db.Column(db.String(20), default='unpaid')
    category = db.Column(db.String(100), default='Utilities')

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'name': self.name,
            'amount': self.amount,
            'due_date': self.due_date,
            'frequency': self.frequency,
            'status': self.status,
            'category': self.category
        }

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(100), default='Streaming')
    is_paid = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'title': self.title,
            'amount': self.amount,
            'due_date': self.due_date,
            'category': self.category,
            'is_paid': self.is_paid
        }

class SavingsGoal(db.Model):
    __tablename__ = 'savings_goals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0)
    target_date = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'title': self.title,
            'target_amount': self.target_amount,
            'current_amount': self.current_amount,
            'target_date': self.target_date
        }

class Asset(db.Model):
    __tablename__ = 'assets'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(50), default='Bank')
    value = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'name': self.name,
            'category': self.category,
            'value': self.value
        }

class Liability(db.Model):
    __tablename__ = 'liabilities'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(50), default='Credit Card')
    amount = db.Column(db.Float, nullable=False)
    interest_rate = db.Column(db.Float, default=0.0)
    minimum_payment = db.Column(db.Float, default=0.0)
    due_date = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'name': self.name,
            'category': self.category,
            'amount': self.amount,
            'interest_rate': self.interest_rate,
            'minimum_payment': self.minimum_payment,
            'due_date': self.due_date
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    type = db.Column(db.String(50), default='info')
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(20), default='info')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'severity': self.severity,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    action = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'action': self.action,
            'timestamp': self.timestamp.isoformat()
        }

class ReportTemplate(db.Model):
    __tablename__ = 'report_templates'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    date_range = db.Column(db.String(50), default='this_month')
    categories = db.Column(db.String(255), nullable=True) # JSON or comma separated
    type = db.Column(db.String(50), default='all')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'title': self.title,
            'dateRange': self.date_range,
            'categories': self.categories.split(',') if self.categories else [],
            'type': self.type,
            'createdAt': self.created_at.isoformat()
        }
