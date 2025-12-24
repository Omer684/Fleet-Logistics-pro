import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-prod'
    DATABASE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'shipments.db')
