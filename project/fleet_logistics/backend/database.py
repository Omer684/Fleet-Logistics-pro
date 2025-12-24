import sqlite3
import uuid
from datetime import datetime
from flask import g
from .config import Config

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(Config.DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS shipment (
            id TEXT PRIMARY KEY,
            trackingId TEXT NOT NULL,
            destination TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    """)
    
    cursor = db.execute("SELECT COUNT(*) FROM shipment")
    if cursor.fetchone()[0] == 0:
        insert_initial_data(db)
    db.commit()

def insert_initial_data(conn):
    print("Inserting initial demo data...")
    initial_shipments = [
        {
            'id': str(uuid.uuid4()), 
            'trackingId': 'TRK001', 
            'destination': '456 Oak Lane, Dallas, TX', 
            'priority': 'High', 
            'status': 'Processing',
            'createdAt': datetime.now().isoformat()
        },
        {
            'id': str(uuid.uuid4()), 
            'trackingId': 'TRK002', 
            'destination': '101 Pine St, Miami, FL', 
            'priority': 'Medium', 
            'status': 'Scheduled',
            'createdAt': datetime.now().isoformat()
        },
        {
            'id': str(uuid.uuid4()), 
            'trackingId': 'TRK003', 
            'destination': '789 Birch Rd, Denver, CO', 
            'priority': 'Low', 
            'status': 'Delivered',
            'createdAt': datetime.now().isoformat()
        },
        {
            'id': str(uuid.uuid4()), 
            'trackingId': 'TRK999', 
            'destination': '123 Main St, New York, NY', 
            'priority': 'High', 
            'status': 'Scheduled',
            'createdAt': datetime.now().isoformat()
        }
    ]
    for s in initial_shipments:
        conn.execute(
            "INSERT INTO shipment VALUES (?, ?, ?, ?, ?, ?)",
            (s['id'], s['trackingId'], s['destination'], s['priority'], s['status'], s['createdAt'])
        )

def get_all_shipments():
    db = get_db()
    shipments = db.execute('SELECT * FROM shipment').fetchall()
    return [dict(row) for row in shipments]

def add_shipment_to_db(data):
    db = get_db()
    new_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO shipment VALUES (?, ?, ?, ?, ?, ?)",
        (new_id, data['trackingId'], data['destination'], data['priority'], data['status'], datetime.now().isoformat())
    )
    db.commit()
    return new_id

def update_shipment_status(shipment_id, status):
    db = get_db()
    cursor = db.execute(
        "UPDATE shipment SET status = ?, createdAt = ? WHERE id = ?",
        (status, datetime.now().isoformat(), shipment_id)
    )
    db.commit()
    return cursor.rowcount > 0

def clear_db():
    db = get_db()
    db.execute("DELETE FROM shipment")
    insert_initial_data(db)
    db.commit()
