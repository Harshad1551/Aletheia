"""
AssemblyAI Integration Module - CORRECT FIX
Updated for latest API (speech_models plural)
"""

import assemblyai as aai
import os
import time
from dotenv import load_dotenv

load_dotenv('.env.assemblyai')


class AssemblyAITranscriber:
    """Handle all transcription operations with AssemblyAI."""
    
    def __init__(self):
        """Initialize with API key from environment."""
        self.api_key = os.getenv("ASSEMBLYAI_API_KEY")
        if not self.api_key:
            raise ValueError("ASSEMBLYAI_API_KEY not found in .env.assemblyai")
        
        aai.settings.api_key = self.api_key
        print("[OK] AssemblyAI initialized")
    
    def transcribe_file(self, audio_file_path, speaker_labels=True):
        """
        Transcribe an audio/video file.
        
        Args:
            audio_file_path: Path to audio/video file
            speaker_labels: Whether to identify different speakers
            
        Returns:
            dict with transcript, speakers, and metadata
        """
        print(f"[UPLOAD] File: {audio_file_path}")
        
        # Configure transcription - UPDATED for new API
        config = aai.TranscriptionConfig(
            speaker_labels=speaker_labels,
            language_code="en",
            speech_models = ["universal-2"]
            # Note: speech_models is set automatically to best available
        )
        
        # Create transcriber
        transcriber = aai.Transcriber()
        
        # Start transcription
        transcript = transcriber.transcribe(audio_file_path, config=config)
        
        # Check for errors
        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"Transcription failed: {transcript.error}")
        
        print("[OK] Transcription completed!")
        print(f"   Transcript ID: {transcript.id}")
        print(f"   Duration: {transcript.audio_duration} seconds")
        
        # Format results
        result = {
            "id": transcript.id,
            "text": transcript.text,
            "duration_seconds": transcript.audio_duration,
            "confidence": transcript.confidence,
            "speakers": self._format_speakers(transcript) if speaker_labels else None,
            "words": [
                {
                    "text": word.text,
                    "start": word.start,
                    "end": word.end,
                    "confidence": word.confidence
                }
                for word in transcript.words
            ] if transcript.words else []
        }
        
        return result
    
    def transcribe_url(self, audio_url, speaker_labels=True):
        """
        Transcribe audio from a URL.
        
        Args:
            audio_url: Public URL to audio/video file
            speaker_labels: Whether to identify speakers
            
        Returns:
            dict with transcript data
        """
        print(f"[UPLOAD] URL: {audio_url}")
        
        config = aai.TranscriptionConfig(
            speaker_labels=speaker_labels,
            language_code="en"
        )
        
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_url, config=config)
        
        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"Transcription failed: {transcript.error}")
        
        print("[OK] Transcription completed!")
        
        result = {
            "id": transcript.id,
            "text": transcript.text,
            "duration_seconds": transcript.audio_duration,
            "speakers": self._format_speakers(transcript) if speaker_labels else None
        }
        
        return result
    
    def _format_speakers(self, transcript):
        """Format speaker utterances into readable format."""
        if not transcript.utterances:
            return None
        
        speakers = []
        for utterance in transcript.utterances:
            speakers.append({
                "speaker": f"Speaker {utterance.speaker}",
                "text": utterance.text,
                "start": utterance.start,
                "end": utterance.end,
                "confidence": utterance.confidence
            })
        
        return speakers
    
    def get_formatted_transcript(self, result):
        """
        Format transcript with speaker labels for readability.
        
        Args:
            result: Result from transcribe_file() or transcribe_url()
            
        Returns:
            Formatted string with speakers
        """
        if not result.get("speakers"):
            return result["text"]
        
        formatted = []
        for utterance in result["speakers"]:
            speaker = utterance["speaker"]
            text = utterance["text"]
            formatted.append(f"{speaker}: {text}")
        
        return "\n\n".join(formatted)


def process_therapy_session(audio_file_path, user_email):
    """
    Complete pipeline: Transcribe → Summarize → Email
    
    Args:
        audio_file_path: Path to recording file
        user_email: User's email address
        
    Returns:
        dict with transcript, summary, and status
    """
    print("\n" + "="*60)
    print("THERAPY SESSION PROCESSING PIPELINE")
    print("="*60)
    
    try:
        # Step 1: Transcribe with AssemblyAI
        print("\n[STEP 1/4] Transcribing audio...")
        transcriber = AssemblyAITranscriber()
        result = transcriber.transcribe_file(audio_file_path, speaker_labels=True)
        
        # Get formatted transcript
        transcript_text = transcriber.get_formatted_transcript(result)
        
        # Save transcript
        with open("transcript.txt", "w", encoding="utf-8") as f:
            f.write(transcript_text)
        print("[SAVED] transcript.txt")
        
        # Step 2: Summarize
        print("\n[STEP 2/4] Generating AI summary...")
        from note_summarization import TranscriptSummarizer
        
        summarizer = TranscriptSummarizer()
        summary = summarizer.summarize_from_file(
            "transcript.txt",
            "summary.txt",
            min_length=120,
            max_length=400
        )
        print("[SAVED] summary.txt")
        
        # Step 3: Email results
        print(f"\n[STEP 3/4] Emailing to {user_email}...")
        from email_sender import send_email
        
        email_body = f"""Your therapy session transcript is ready!

=== AI SUMMARY ===
{summary}

=== FULL TRANSCRIPT ===
{transcript_text}

=== SESSION INFO ===
Duration: {result['duration_seconds']} seconds ({result['duration_seconds']//60} minutes)
Transcript ID: {result['id']}
Confidence: {result.get('confidence', 'N/A')}

---
Generated by AI Therapist Note-Taking System
Powered by AssemblyAI
"""
        
        send_email(user_email, email_body)
        
        print("\n[STEP 4/4] Complete!")
        print("="*60)
        print("[SUCCESS]")
        print(f"   Transcript: {len(transcript_text)} characters")
        print(f"   Summary: {len(summary)} characters")
        print(f"   Email sent to: {user_email}")
        print("="*60)
        
        return {
            "status": "success",
            "transcript": transcript_text,
            "summary": summary,
            "duration": result['duration_seconds'],
            "transcript_id": result['id']
        }
    
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    print("AssemblyAI Transcriber - Test Mode")
    print("="*60)
    
    test_file = input("Enter path to test audio file: ").strip()
    test_email = input("Enter test email address: ").strip()
    
    if test_file and test_email:
        result = process_therapy_session(test_file, test_email)
        print(f"\nResult: {result['status']}")
    else:
        print("Test cancelled")