import os
import sys
import getpass

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app import app, db, User

def main():
    print("==================================================")
    print("FinAI Expense Manager — Superuser Admin Creator")
    print("==================================================")

    env_email = os.environ.get('ADMIN_EMAIL')
    env_password = os.environ.get('ADMIN_PASSWORD')

    if env_email and env_password:
        email = env_email.strip().lower()
        password = env_password
        print(f"Loaded admin credentials from environment for: {email}")
    else:
        email = input("Enter Admin Email: ").strip().lower()
        if not email:
            print("Error: Email cannot be empty.")
            sys.exit(1)

        password = getpass.getpass("Enter Admin Password: ")
        confirm_password = getpass.getpass("Confirm Admin Password: ")

        if password != confirm_password:
            print("Error: Passwords do not match.")
            sys.exit(1)

        if len(password) < 6:
            print("Error: Admin password must be at least 6 characters.")
            sys.exit(1)

    with app.app_context():
        user = User.query.filter_by(email=email).first()

        if user:
            user.role = 'admin'
            user.is_active = True
            if password:
                user.password_hash = password
            db.session.commit()
            print(f"[OK] Existing user '{email}' successfully promoted to Superuser Admin.")
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
            print(f"[OK] New Superuser Admin '{email}' created successfully.")

if __name__ == '__main__':
    main()
