from flask import Flask, render_template
from flask_cors import CORS
from .config import Config
from .database import init_db, close_db
from .routes import api_bp

def create_app():
    app = Flask(__name__, 
                template_folder='../templates',
                static_folder='../static')
    app.config.from_object(Config)

    CORS(app)

    @app.teardown_appcontext
    def teardown_db(exception):
        close_db(exception)

    # Register Blueprints
    app.register_blueprint(api_bp)

    @app.route('/')
    def home():
        return render_template('index.html')

    # Initialize DB (in a real app, use flask cli command)
    with app.app_context():
        init_db()

    return app

if __name__ == '__main__':
    app = create_app()
    print("Starting Flask API server on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
