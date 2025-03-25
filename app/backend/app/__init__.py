from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Updated CORS configuration:
    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
    
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
    
    # Optional: If you're using JWTs via cookies, configure token locations
    app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Disable for local testing
    
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    from .routes import main
    app.register_blueprint(main)
    
    return app
