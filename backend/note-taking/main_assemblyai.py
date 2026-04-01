"""
Main Application - AssemblyAI Version
Replacement for the Vexa main.py
"""

import os
from dotenv import load_dotenv
from assemblyai_integration import AssemblyAITranscriber, process_therapy_session

# Load environment variables
load_dotenv('.env.assemblyai')
load_dotenv('.env.email')
load_dotenv('.env.ai_summ')


def main():
    """
    Simple command-line interface for transcription.
    Upload file → Get transcript via email
    """
    print("="*70)
    print("AI THERAPIST - SESSION TRANSCRIPTION")
    print("Powered by AssemblyAI")
    print("="*70)
    
    # Get user inputs
    print("\n📁 STEP 1: Select your recording file")
    audio_file = input("Enter path to audio/video file: ").strip()
    
    if not audio_file:
        print("❌ No file provided!")
        return
    
    if not os.path.exists(audio_file):
        print(f"❌ File not found: {audio_file}")
        return
    
    # Get file size
    file_size_mb = os.path.getsize(audio_file) / (1024 * 1024)
    print(f"   File: {os.path.basename(audio_file)}")
    print(f"   Size: {file_size_mb:.2f} MB")
    
    print("\n📧 STEP 2: Enter your email")
    user_email = input("Email address: ").strip()
    
    if not user_email:
        print("❌ Email required!")
        return
    
    # Confirm
    print("\n" + "="*70)
    print("READY TO PROCESS")
    print("="*70)
    print(f"File: {audio_file}")
    print(f"Email: {user_email}")
    print(f"Estimated time: {int(file_size_mb * 0.5)} - {int(file_size_mb)} minutes")
    print("="*70)
    
    confirm = input("\nProceed? (yes/no): ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print("Cancelled.")
        return
    
    # Process the session
    result = process_therapy_session(audio_file, user_email)
    
    if result['status'] == 'success':
        print("\n" + "="*70)
        print("🎉 SUCCESS!")
        print("="*70)
        print(f"✅ Transcript sent to: {user_email}")
        print(f"✅ Files saved locally:")
        print(f"   - transcript.txt")
        print(f"   - summary.txt")
        print("="*70)
    else:
        print("\n" + "="*70)
        print("❌ PROCESSING FAILED")
        print("="*70)
        print(f"Error: {result.get('error', 'Unknown error')}")
        print("="*70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
