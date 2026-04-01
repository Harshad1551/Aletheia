import sys
import os
import json
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Fix Windows cp1252 encoding — emojis require UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from google import genai
from google.genai import types
from crisis_control import check_for_crisis, crisis_response, send_crisis_notification
from avatars import avatars

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), ".env.chatbot")
load_dotenv(env_path)

# --- Emotion Analysis Setup --- #
try:
    from transformers import pipeline
    from huggingface_hub import login
    hf_token = os.getenv("HF_TOKEN")
    if hf_token:
        login(hf_token)
    sentiment_analysis = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        framework='pt'
    )
    MOOD_ENABLED = True
except Exception as e:
    sentiment_analysis = None
    MOOD_ENABLED = False

# --- DB Setup for Mood --- #
try:
    import mysql.connector
    DB_CONFIG = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", 3306)),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "therapy"),
    }
    DB_ENABLED = True
except ImportError:
    DB_ENABLED = False

# --- Global Scope Constraints --- #
conversation_history = []
user_prompts = []

def log_debug(msg):
    try:
        log_path = os.path.join(os.path.dirname(__file__), "debug.log")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except:
        pass

def analyze_mood(user_input):
    """Run emotion analysis on user message and return it."""
    if not MOOD_ENABLED or sentiment_analysis is None:
        return None, None
    try:
        result = sentiment_analysis(user_input)[0]
        emotion = result['label']
        confidence = result['score']
        return emotion, confidence
    except Exception as e:
        log_debug(f"Mood analysis error: {str(e)}")
        return None, None
# Note: The old DB saving function was removed for architecture shift.
# Python now delegates DB insertion to Node.js for centralized AES encryption.

# --- Main chatbot function --- #
def run_chatbot():
    log_debug("Starting chatbot...")
    global conversation_history

    username = "Dhanu-jodd"
    contact_info = "adobeanimate2025@outlook.com"

    # Get API Key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env.chatbot", file=sys.stderr)
        return

    # Initialize Gemini Client
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Gemini: {e}", file=sys.stderr)
        return

    # Initial Default Avatar (can be overridden per message)
    current_avatar_name = "Academic/Career Stress"

    # Signal Node.js that chatbot is ready
    print("READY", flush=True)

    # Main Chat Loop
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            line = line.strip()
        except EOFError:
            break

        if not line:
            continue

        # Parse JSON input from Node.js
        user_input = line
        user_id = None
        chat_id = None
        try:
            parsed = json.loads(line)
            user_input = parsed.get("message", "")
            user_id = parsed.get("user_id")
            chat_id = parsed.get("chat_id")
            req_avatar = parsed.get("avatar_name")
            if req_avatar and req_avatar in avatars:
                current_avatar_name = req_avatar
        except (json.JSONDecodeError, ValueError):
            # Fallback: treat line as plain text (backward compat)
            user_input = line

        # Dynamically build system prompt for this specific message
        base_prompt = avatars[current_avatar_name]["prompt"]

        system_prompt = base_prompt + (
            "\n\nCRITICAL INSTRUCTIONS FOR RESPONSE FORMATTING:"
            "\n- Use relevant emojis naturally throughout your responses to make them warm and engaging (e.g., 💙, 🌿, ✨, 🤗, 💪, 🌸). Don't overdo it — 2-4 emojis per response is ideal."
            "\n- NEVER write a single long paragraph. Break your response into 2-4 short paragraphs separated by blank lines."
            "\n- Keep each paragraph to 1-3 sentences maximum."
            "\n- Start with a short empathetic acknowledgment line (with an emoji)."
            "\n- Then provide your supportive advice or thoughts in the next paragraph(s)."
            "\n- End the main reply with a warm, gentle closing thought before the suggestions."
            "\n\nCRITICAL INSTRUCTIONS FOR SUGGESTIONS:"
            "\n1. At the very end of EVERY response, after your main reply, you MUST add a section titled exactly '---SUGGESTIONS---' followed by a newline."
            "\n2. Under that, list exactly 3 numbered follow-up suggestions (1, 2, 3). Each must be a short sentence (under 15 words)."
            "\n3. MOST IMPORTANT RULE — the suggestions MUST be deeply and directly related to the specific emotion, topic, or situation the user just described. They should feel like natural next things a user would want to say or explore about THAT specific feeling."
            "\n4. Think of suggestions as things the USER would say next about their own situation — not generic therapy questions. They are clickable replies the user sends back to you."
            "\n5. BAD example — if user says 'I am feeling sad lately', do NOT suggest unrelated topics like sleep, career, or breathing exercises. Instead:"
            "\n---SUGGESTIONS---"
            "\n1. I think the sadness is coming from feeling alone."
            "\n2. Can you help me understand why I feel this way?"
            "\n3. What are some things I can do when sadness hits?"
            "\n6. Another example — if user says 'I had a fight with my friend', good suggestions would be:"
            "\n---SUGGESTIONS---"
            "\n1. I want to fix things but don't know how to start."
            "\n2. It keeps replaying in my head and I feel guilty."
            "\n3. How do I communicate better during conflicts?"
            "\n7. The suggestions should sound like the user's own words/thoughts — things they would naturally want to say next about their situation."
            "\nDo NOT skip the suggestions section. It must appear in every single response."
        )

        gemini_config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
        )

        if not user_input:
            continue

        if user_input.lower() in ["exit", "quit"]:
            break

        log_debug(f"Received input: {user_input} (user={user_id}, chat={chat_id})")
        user_prompts.append(user_input)

        # Analyze emotion
        detected_emotion, emotion_confidence = analyze_mood(user_input)

        # Crisis Detection First
        if check_for_crisis(user_input):
            send_crisis_notification(user_input, username, contact_info)
            response_text = crisis_response()
            log_debug("Crisis detected.")
        else:
            try:
                contents = []
                for turn in conversation_history:
                    contents.append(
                        types.Content(
                            role=turn["role"],
                            parts=[types.Part(text=turn["parts"][0]["text"])]
                        )
                    )
                contents.append(
                    types.Content(
                        role="user",
                        parts=[types.Part(text=user_input)]
                    )
                )

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=contents,
                    config=gemini_config
                )

                response_text = response.text
                log_debug(f"Generated response: {response_text[:50]}...")

                conversation_history.append(
                    {"role": "user", "parts": [{"text": user_input}]}
                )
                conversation_history.append(
                    {"role": "model", "parts": [{"text": response_text}]}
                )

            except Exception as e:
                response_text = f"Error during chatbot response: {str(e)}"
                log_debug(f"Exception: {str(e)}")

        # Parse out suggestions from the response if present
        suggestions = []
        reply_text = response_text
        if "---SUGGESTIONS---" in response_text:
            parts = response_text.split("---SUGGESTIONS---", 1)
            reply_text = parts[0].strip()
            raw_suggestions = parts[1].strip()
            for line in raw_suggestions.splitlines():
                line = line.strip()
                # Match lines starting with 1. 2. 3.
                if line and line[0].isdigit() and len(line) > 2 and line[1] in '.):':
                    suggestions.append(line[2:].strip())

        output = json.dumps({
            "reply": reply_text,
            "suggestions": suggestions[:3],
            "emotion": detected_emotion,
            "confidence": emotion_confidence
        }, ensure_ascii=False)
        print(output, flush=True)


if __name__ == "__main__":
    run_chatbot()