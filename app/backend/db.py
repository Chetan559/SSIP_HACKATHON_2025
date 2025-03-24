import psycopg2

def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="chatbot_db",
        user="your_pg_user",
        password="your_pg_password"
    )
    return conn
