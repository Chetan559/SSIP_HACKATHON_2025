from flask import Blueprint, request, jsonify
from . import db, bcrypt
from .models import User, ChatSession, Message
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

main = Blueprint('main', __name__)

# Signup
@main.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    hashed = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(name=data['name'], email=data['email'], password=hashed)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created"}), 201

# Login
@main.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        token = create_access_token(identity=user.id)
        return jsonify({"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}})
    return jsonify({"message": "Invalid credentials hahha"}), 401

# Get sessions
@main.route('/api/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    user_id = get_jwt_identity()
    sessions = ChatSession.query.filter_by(user_id=user_id).order_by(ChatSession.updated_at.desc()).all()
    result = [{"id": s.id, "title": s.title, "last_message": s.last_message, "updated_at": s.updated_at} for s in sessions]
    return jsonify(result)

# Create session
@main.route('/api/sessions', methods=['POST'])
@jwt_required()
def create_session():
    user_id = get_jwt_identity()
    data = request.json
    session = ChatSession(user_id=user_id, title=data['title'])
    db.session.add(session)
    db.session.commit()
    return jsonify({"id": session.id, "title": session.title})

# Get messages in session
@main.route('/api/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_messages(session_id):
    messages = Message.query.filter_by(session_id=session_id).order_by(Message.timestamp).all()
    result = [{"sender": m.sender, "content": m.content, "timestamp": m.timestamp} for m in messages]
    return jsonify(result)

# Send message
@main.route('/api/sessions/<int:session_id>/msg', methods=['POST'])
@jwt_required()
def send_message(session_id):
    data = request.json
    message = Message(session_id=session_id, sender=data['sender'], content=data['content'])
    db.session.add(message)
    session = ChatSession.query.get(session_id)
    session.last_message = data['content']
    db.session.commit()
    return jsonify({"message": "Message sent"}), 201
