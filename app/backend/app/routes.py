from flask import Blueprint, request, jsonify
import requests
from . import db, bcrypt
from .models import User, ChatSession, Message
import random
from datetime import datetime
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

main = Blueprint('main', __name__)


botResponses = [
    "Thank you for your question. I'm here to help you with government services.",
    "That's a great question about our services. Let me provide you with some information.",
    "I understand your concern. Here's what you need to know about this topic.",
    "Based on your query, I can direct you to the right department for more assistance.",
    "The information you're looking for can be found on our official website. Would you like me to provide a direct link?",
    "I'm processing your request. This might take a moment.",
    "For security reasons, please do not share any personal identification details in this chat.",
    "To better assist you, could you please provide more specific details about your query?",
    "This information is handled by a different department. I'm directing your query to the appropriate channel.",
]

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
        # token = create_access_token(identity=user.id)
        token = create_access_token(identity=str(user.id))
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
    print("Received message request for session:", session_id)
    data = request.json
    print("Request data:", data)
    user_id = get_jwt_identity()
    print("User ID:", user_id)

    # Save user message
    user_message = Message(session_id=session_id, sender="user", content=data['content'])
    db.session.add(user_message)
    
    # Generate a bot response
    # bot_response = random.choice(botResponses)   # random response from predefined list
    
    # Forward user query to external API
    try:
        print("inside try")
        API_URL = "https://05b9-34-125-76-201.ngrok-free.app/generate"
        response = requests.post(API_URL, json={"user_query": data['content']}, timeout=1000)
        
        if response.status_code == 200:
            bot_response = response.json().get("generated_text", "I'm sorry, I couldn't fetch the information.")
        else:
            bot_response = "There was an issue retrieving the information. Please try again later."
            
    except requests.exceptions.RequestException as e:
    # except Exception as e:
        # print(e)
        print("API request failed:", e)
        bot_response = "I'm currently unable to fetch the required information. Please try again later."

    # Save bot response
    bot_message = Message(session_id=session_id, sender="bot", content=bot_response)
    db.session.add(bot_message)



    # Update session last message
    session = ChatSession.query.get(session_id)
    if session:
        session.last_message = data['content']
        session.updated_at = datetime.utcnow()

    db.session.commit()
    print("Bot response:", bot_response)

    return jsonify({
        "message": "Message sent",
        "bot_response": bot_response
    }), 201
# def send_message(session_id):
#     print("Received message request for session:", session_id)
#     data = request.json
#     print("Request data:", data)
#     user_id = get_jwt_identity()
#     print("User ID:", user_id)

#     # Save user message
#     user_message = Message(session_id=session_id, sender="user", content=data['content'])
#     db.session.add(user_message)


#     db.session.commit()
#     print("Bot response:", bot_response)

#     return jsonify({
#         "message": "Message sent",
#         "bot_response": bot_response
#     }), 201

