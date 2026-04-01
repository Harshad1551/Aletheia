import os
# Fix TensorFlow/Protobuf conflicts
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TRANSFORMERS_NO_TENSORFLOW'] = '1'
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

from huggingface_hub import login
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from dotenv import load_dotenv
import torch

# --- Loading Pipeline --- #
load_dotenv('.env.ai_summ')
access_token = os.getenv('API_KEY')
if access_token:
    try:
        login(access_token)
    except Exception as e:
        print(f"[WARN] HuggingFace login failed (token may be expired): {e}")
        print("[INFO] Continuing without login — public models will still work.")

class TranscriptSummarizer:
    def __init__(self, model_name="philschmid/bart-large-cnn-samsum", chunk_token_limit=14000):
        self.model_name = model_name
        self.chunk_token_limit = chunk_token_limit
        
        print(f"[INFO] Loading model: {model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        
        # Move to GPU if available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        print(f"[INFO] Model loaded on {self.device}")

    def _summarize_chunk(self, text, min_length=100, max_length=500):
        # Direct model generation is more robust than pipeline() on some versions
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=1024).to(self.device)
        
        summary_ids = self.model.generate(
            inputs["input_ids"],
            num_beams=4,
            min_length=min_length,
            max_length=max_length,
            early_stopping=True
        )
        
        return self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    def summarize_text(self, text, min_length=100, max_length=500):
        tokens = self.tokenizer.encode(text)
        print(f"[INFO] Transcript length: {len(tokens)} tokens")

        if len(tokens) <= self.chunk_token_limit:
            return self._summarize_chunk(text, min_length, max_length)

        summaries = []
        for i in range(0, len(tokens), self.chunk_token_limit):
            chunk_tokens = tokens[i:i + self.chunk_token_limit]
            chunk_text = self.tokenizer.decode(chunk_tokens, skip_special_tokens=True)

            print(f"Summarizing chunk {len(summaries)+1}...")
            chunk_summary = self._summarize_chunk(chunk_text, min_length, max_length)
            summaries.append(chunk_summary)

        merged_text = " ".join(summaries)
        print("\nFinished chunking. Now generating final meta-summary...")

        return self._summarize_chunk(merged_text, min_length, max_length)

    def summarize_from_file(self, input_file, output_file="summary.txt", min_length=100, max_length=500):
        with open(input_file, "r", encoding="utf-8") as f:
            transcript = f.read()

        final_summary = self.summarize_text(transcript, min_length, max_length)

        with open(output_file, "w", encoding="utf-8") as f:
            f.write(final_summary)

        print(f"\n[SAVED] Final Summary saved in {output_file}")
        return final_summary

if __name__ == "__main__":
    summarizer = TranscriptSummarizer()

    summarizer.summarize_from_file(
        input_file="transcript.txt",
        output_file="summary.txt",
        min_length=120,
        max_length=400
    )