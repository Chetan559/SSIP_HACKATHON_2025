from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes.auth_routes import auth
from routes.chat_routes import chat

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Use env var in production
CORS(app, resources={r"/*": {"origins": "http://localhost:5173", "supports_credentials": True}})



jwt = JWTManager(app)
app.register_blueprint(auth)
app.register_blueprint(chat)

if __name__ == '__main__':
    app.run(debug=True)
