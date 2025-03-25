from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_db_connection

chat = Blueprint('chat', __name__)

@chat.route('/chat', methods=['POST'])
@jwt_required()
def save_message():
    user_id = get_jwt_identity()
    message = request.json['message']
    
    # Get the user's name from database
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get user name
    cur.execute("SELECT name FROM users WHERE id = %s", (user_id,))
    user_data = cur.fetchone()
    user_name = user_data[0] if user_data else 'user'
    
    # Save user message
    cur.execute("INSERT INTO chat_history (user_id, message, is_user) VALUES (%s, %s, TRUE)", 
                (user_id, message))
    
    # Generate bot reply
    bot_responses = [
        "Thank you for your question. I'm here to help you with government services.",
        "That's a great question about our services. Let me provide you with some information.",
        "I understand your concern. Here's what you need to know about this topic.",
        "Based on your query, I can direct you to the right department for more assistance.",
        "The information you're looking for can be found on our official website. Would you like me to provide a direct link?",
        "I'm processing your request. This might take a moment.",
        "For security reasons, please do not share any personal identification details in this chat.",
        "To better assist you, could you please provide more specific details about your query?",
        "This information is handled by a different department. I'm directing your query to the appropriate channel."
    ]
    
    # Pick a random response
    import random
    bot_reply = random.choice(bot_responses)
    
    # Save bot reply
    cur.execute("INSERT INTO chat_history (user_id, message, is_user) VALUES (%s, %s, FALSE)", 
                (user_id, bot_reply))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"reply": bot_reply}), 200