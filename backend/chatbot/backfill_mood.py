"""
backfill_mood.py

Reads ALL existing user messages from the messages table (joined with chat_history
for user_id), runs emotion analysis, and saves results to mood_analysis.

Run once from the backend/chatbot directory:
    python backfill_mood.py
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env.chatbot")
load_dotenv(env_path)

import mysql.connector
from transformers import pipeline
from huggingface_hub import login

# --- Auth & DB Config ---
hf_token = os.getenv("HF_TOKEN")
if hf_token:
    login(hf_token)

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 3306)),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "therapy"),
}

print("Loading emotion model...")
sentiment_analysis = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    framework='pt'
)
print("Model loaded. Connecting to DB...")

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor(dictionary=True)

# Fetch all user messages joined with chat_history to get user_id
# No id column -- use chat_id + created_at as unique identifier
cursor.execute("""
    SELECT m.chat_id, m.content, m.created_at, ch.user_id
    FROM messages m
    JOIN chat_history ch ON m.chat_id = ch.chat_id
    WHERE m.sender = 'user'
    ORDER BY m.created_at ASC
""")

messages = cursor.fetchall()
print(f"Found {len(messages)} user messages.")

# Get already-analyzed (user_id, chat_id, analyzed_at) combos to skip duplicates
cursor.execute("SELECT user_id, chat_id, analyzed_at FROM mood_analysis")
existing = set(
    (row['user_id'], row['chat_id'], str(row['analyzed_at']))
    for row in cursor.fetchall()
)
print(f"Already analyzed: {len(existing)} entries — will skip those.")

insert_cursor = conn.cursor()
saved = 0
skipped = 0

for i, msg in enumerate(messages):
    content    = msg['content']
    user_id    = msg['user_id']
    chat_id    = msg['chat_id']
    created_at = msg['created_at']

    if not content or not content.strip():
        skipped += 1
        continue

    # Skip if already exists
    key = (user_id, chat_id, str(created_at))
    if key in existing:
        skipped += 1
        continue

    try:
        result     = sentiment_analysis(content[:512])[0]
        emotion    = result['label']
        confidence = float(result['score'])

        insert_cursor.execute("""
            INSERT INTO mood_analysis (user_id, chat_id, emotion, confidence, analyzed_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, chat_id, emotion, confidence, created_at))

        existing.add(key)
        saved += 1

        if (saved) % 10 == 0:
            conn.commit()
            print(f"  Progress: {i+1}/{len(messages)}  saved={saved}  skipped={skipped}")

    except Exception as e:
        print(f"  Error on chat_id={chat_id} at {created_at}: {e}")
        skipped += 1

conn.commit()
insert_cursor.close()
cursor.close()
conn.close()

print(f"\nDone! Saved: {saved}, Skipped: {skipped}")
