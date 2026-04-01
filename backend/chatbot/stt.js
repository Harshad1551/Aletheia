const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const authenticate = require("../auth/auth-middleware");

const router = express.Router();

// Store uploads in memory as Buffer (no disk write needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

/**
 * POST /stt/transcribe
 * Accepts an audio file via multipart/form-data,
 * forwards it to Sarvam AI's Speech-to-Text API,
 * and returns the transcribed text.
 */
router.post("/transcribe", authenticate, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided." });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("[STT] API_KEY is not set in .env");
      return res.status(500).json({ message: "STT service is not configured." });
    }

    // Build the multipart form to send to Sarvam
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "recording.webm",
      contentType: req.file.mimetype || "audio/webm",
    });
    form.append("model", "saaras:v3");
    form.append("language_code", "unknown");

    const sarvamResponse = await axios.post(
      "https://api.sarvam.ai/speech-to-text",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "api-subscription-key": apiKey,
        },
        timeout: 30000, // 30 second timeout
      }
    );

    // Sarvam typically returns { transcript: "..." }
    const transcript = sarvamResponse.data?.transcript || "";

    console.log(`[STT] Transcription result: "${transcript.substring(0, 80)}..."`);

    res.status(200).json({ transcript });
  } catch (error) {
    console.error("[STT] Error:", error.response?.data || error.message);
    res.status(500).json({
      message: "Speech-to-text failed.",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
