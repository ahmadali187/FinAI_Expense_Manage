import os
import sys
import sqlite3
import datetime

def backup_database():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    source_db = os.path.join(base_dir, 'backend', 'finai.db')
    backup_dir = os.path.join(base_dir, 'backups')

    if not os.path.exists(source_db):
        print(f"Error: Source database does not exist at {source_db}")
        sys.exit(1)

    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    backup_filename = f"finai_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)

    print("==================================================")
    print("FINAI EXPENSE MANAGER — ATOMIC SQLITE BACKUP")
    print("==================================================")
    print(f"Source Database : {source_db}")
    print(f"Backup Target   : {backup_path}")

    source_conn = sqlite3.connect(source_db)
    backup_conn = sqlite3.connect(backup_path)

    with backup_conn:
        source_conn.backup(backup_conn)

    backup_conn.close()
    source_conn.close()

    size_bytes = os.path.getsize(backup_path)
    size_kb = size_bytes / 1024.0

    print(f"[OK] Backup completed successfully!")
    print(f"Backup Size : {size_kb:.2f} KB ({size_bytes} bytes)")
    print(f"Timestamp   : {timestamp}")
    print("==================================================")

    return backup_path

if __name__ == '__main__':
    backup_database()
