import os
import sys
import sqlite3

def inspect_database():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', 'finai.db'))
    
    print("==================================================")
    print("FINAI EXPENSE MANAGER — SQLITE DATABASE INSPECTOR")
    print("==================================================")
    print(f"DATABASE PATH: {db_path}\n")

    if not os.path.exists(db_path):
        print(f"Error: Database file does not exist at {db_path}")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    print(f"TOTAL TABLES FOUND: {len(tables)}\n")

    for table in sorted(tables):
        cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
        count = cursor.fetchone()[0]

        cursor.execute(f"PRAGMA table_info(`{table}`)")
        columns = cursor.fetchall()

        cursor.execute(f"PRAGMA foreign_key_list(`{table}`)")
        fk_list = cursor.fetchall()
        fk_map = {fk[3]: f"-> {fk[2]}.{fk[4]}" for fk in fk_list}

        print(f"TABLE: {table} ({count} records)")
        print("-" * 50)
        print(f"{'COLUMN':<20} {'TYPE':<12} {'NULLABLE':<10} {'PK':<5} {'FOREIGN KEY'}")
        print("-" * 50)

        for col in columns:
            col_id, col_name, col_type, not_null, default_val, pk = col
            nullable_str = "NO" if not_null else "YES"
            pk_str = "YES" if pk else "NO"
            fk_str = fk_map.get(col_name, "")
            print(f"{col_name:<20} {col_type:<12} {nullable_str:<10} {pk_str:<5} {fk_str}")

        print("\n")

    conn.close()

if __name__ == '__main__':
    inspect_database()
