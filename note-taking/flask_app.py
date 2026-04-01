"""
Flask Web Backend for Transcription Service
Use this for your website integration
"""

from flask import Flask, request, jsonify, render_template_string
from werkzeug.utils import secure_filename
import os
from assemblyai_integration import process_therapy_session
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.assemblyai')
load_dotenv('.env.email')
load_dotenv('.env.ai_summ')

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
ALLOWED_EXTENSIONS = {
    'mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac',  # Audio
    'mp4', 'mov', 'avi', 'mkv', 'webm'  # Video
}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Simple upload form for testing."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI Therapist - Session Transcription</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #333;
                margin-bottom: 30px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #555;
            }
            input[type="file"],
            input[type="email"] {
                width: 100%;
                padding: 10px;
                border: 2px solid #ddd;
                border-radius: 5px;
                box-sizing: border-box;
            }
            button {
                background: #4CAF50;
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                width: 100%;
            }
            button:hover {
                background: #45a049;
            }
            button:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .status {
                margin-top: 20px;
                padding: 15px;
                border-radius: 5px;
                display: none;
            }
            .status.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .status.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .status.processing {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            .supported-formats {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧠 AI Therapist Session Transcription</h1>
            
            <form id="uploadForm">
                <div class="form-group">
                    <label for="audioFile">📁 Upload Recording:</label>
                    <input type="file" id="audioFile" name="file" accept="audio/*,video/*" required>
                    <div class="supported-formats">
                        Supported: MP3, M4A, MP4, WAV, MOV, and more
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="email">📧 Your Email:</label>
                    <input type="email" id="email" name="email" placeholder="your@email.com" required>
                </div>
                
                <button type="submit" id="submitBtn">
                    Get Transcript
                </button>
            </form>
            
            <div id="status" class="status"></div>
        </div>
        
        <script>
            const form = document.getElementById('uploadForm');
            const submitBtn = document.getElementById('submitBtn');
            const status = document.getElementById('status');
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const file = document.getElementById('audioFile').files[0];
                
                if (!file) {
                    showStatus('Please select a file', 'error');
                    return;
                }
                
                // Show processing status
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
                showStatus('Uploading and processing your recording. This may take 15-20 minutes...', 'processing');
                
                try {
                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showStatus(data.message || 'Success! Check your email for the transcript.', 'success');
                        form.reset();
                    } else {
                        showStatus(data.error || 'An error occurred', 'error');
                    }
                } catch (error) {
                    showStatus('Network error: ' + error.message, 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Get Transcript';
                }
            });
            
            function showStatus(message, type) {
                status.textContent = message;
                status.className = 'status ' + type;
                status.style.display = 'block';
            }
        </script>
    </body>
    </html>
    """
    return render_template_string(html)


@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    """
    Main transcription endpoint.
    
    Accepts: multipart/form-data with 'file' and 'email'
    Returns: JSON with status and message
    """
    try:
        # Validate file upload
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "error": f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # Validate email
        email = request.form.get('email')
        if not email:
            return jsonify({"error": "Email address required"}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        print(f"[INFO] File saved: {filepath}")
        print(f"[INFO] Email: {email}")
        
        # Process the session
        result = process_therapy_session(filepath, email)
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
            print(f"[INFO] Cleaned up: {filepath}")
        except:
            pass
        
        # Return result
        if result['status'] == 'success':
            return jsonify({
                "status": "success",
                "message": f"Transcript sent to {email}! Check your inbox.",
                "transcript": result.get('transcript', ''),
                "summary": result.get('summary', ''),
                "duration_seconds": result.get('duration'),
                "transcript_id": result.get('transcript_id')
            }), 200
        else:
            return jsonify({
                "status": "error",
                "error": result.get('error', 'Unknown error')
            }), 500
    
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "transcription"}), 200


if __name__ == '__main__':
    print("="*70)
    print("AI THERAPIST TRANSCRIPTION SERVICE")
    print("="*70)
    print("Starting Flask server...")
    print("Open your browser to: http://localhost:5000")
    print("="*70)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
