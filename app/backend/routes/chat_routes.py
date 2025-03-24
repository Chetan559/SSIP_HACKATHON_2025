from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_db_connection

chat = Blueprint('chat', __name__)

@chat.route('/chat', methods=['POST'])
@jwt_required()
def save_message():
    user_id = get_jwt_identity()
    message = request.json['message']
    
    # Save user message
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO chat_history (user_id, message, is_user) VALUES (%s, %s, TRUE)", 
                (user_id, message))
    
    # Generate bot reply
    bot_reply = "This is a bot reply."
    cur.execute("INSERT INTO chat_history (user_id, message, is_user) VALUES (%s, %s, FALSE)", 
                (user_id, bot_reply))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"reply": bot_reply}), 200
