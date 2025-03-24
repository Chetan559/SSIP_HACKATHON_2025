from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from db import get_db_connection

auth = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data['username']
    email = data['email']
    password = data['password']
    
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (username, email, hashed_pw))
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    token = create_access_token(identity=user_id)
    return jsonify({"token": token}), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data['email']
    password = data['password']
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash FROM users WHERE email = %s", (email,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if result and bcrypt.check_password_hash(result[1], password):
        token = create_access_token(identity=result[0])
        return jsonify({"token": token}), 200
    else:
        return jsonify({"msg": "Invalid credentials hehe"}), 401
