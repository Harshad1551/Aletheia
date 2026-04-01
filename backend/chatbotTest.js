const express = require("express");
const { spawn } = require("child_process");
const pool = require("./database/DB");
const authenticate = require("./auth/auth-middleware");
const { encrypt, decrypt } = require("./utils/encryption");

const router = express.Router();

// ─── Python Process Setup ───────────────────────────────────────────────────
const pythonProcess = spawn("python", ["-u", "./chatbot/app.py"]);

// Queue of pending response handlers (one per in-flight request)
let pendingResolve = null;

pythonProcess.stderr.on("data", (data) => {
  console.error("PYTHON ERROR:", data.toString().trim());
});

pythonProcess.stdout.on("data", (data) => {
  const output = data.toString().trim();

  if (!output || output === "READY") {
    if (output === "READY") console.log("[Chatbot] Python process ready.");
    return;
  }

  // Route the output to the waiting request handler
  if (pendingResolve) {
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve(output);
  } else {
    console.log("[Chatbot] Unhandled Python output:", output);
  }
});

pythonProcess.on("exit", (code) => {
  console.error(`[Chatbot] Python process exited with code ${code}`);
  if (pendingResolve) {
    pendingResolve(null); // Unblock any waiting request
    pendingResolve = null;
  }
});

// Helper: send a message to Python and wait for the reply
function askPython(message, userId, chatId, avatarName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingResolve = null;
      reject(new Error("Python response timed out after 30s"));
    }, 30000);

    pendingResolve = (reply) => {
      clearTimeout(timeout);
      resolve(reply);
    };

    // Send JSON so Python knows user_id and chat_id for mood tracking
    const payload = JSON.stringify({ message, user_id: userId, chat_id: chatId, avatar_name: avatarName });
    pythonProcess.stdin.write(payload + "\n", (err) => {
      if (err) {
        clearTimeout(timeout);
        pendingResolve = null;
        reject(err);
      }
    });
  });
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /history - Get all chats for user
router.get("/history", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.userId]
    );
    const decryptedRows = rows.map(r => ({
      ...r,
      title: decrypt(r.title, r.iv),
      iv: undefined
    }));
    res.json(decryptedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// GET /:chatId - Get messages for a specific chat
router.get("/:chatId", authenticate, async (req, res) => {
  try {
    const [chats] = await pool.query(
      "SELECT * FROM chat_history WHERE chat_id = ? AND user_id = ?",
      [req.params.chatId, req.user.userId]
    );
    if (chats.length === 0)
      return res.status(404).json({ message: "Chat not found" });

    const [messages] = await pool.query(
      "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
      [req.params.chatId]
    );
    const decryptedMessages = messages.map(m => ({
      ...m,
      content: decrypt(m.content, m.iv),
      iv: undefined
    }));
    res.json(decryptedMessages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /chat - Send a message
router.post("/chat", authenticate, async (req, res) => {
  const { message, chatId, avatarName } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  let currentChatId = chatId;

  try {
    // 1. Create new chat session if needed
    if (!currentChatId) {
      const plaintextTitle = message.substring(0, 30) + "...";
      const { iv: titleIv, encryptedData: encTitle } = encrypt(plaintextTitle);
      
      const [result] = await pool.query(
        "INSERT INTO chat_history (user_id, title, iv, created_at) VALUES (?, ?, ?, NOW())",
        [req.user.userId, encTitle, titleIv]
      );
      currentChatId = result.insertId;
    }

    // 2. Save user message to DB
    const { iv: userIv, encryptedData: encUserMsg } = encrypt(message);
    await pool.query(
      "INSERT INTO messages (chat_id, sender, content, iv, created_at) VALUES (?, 'user', ?, ?, NOW())",
      [currentChatId, encUserMsg, userIv]
    );

    // 3. Send to Python and wait for reply
    console.log(`[Chatbot] Sending to Python: "${message}"`);
    const reply = await askPython(message, req.user.userId, currentChatId, avatarName);

    if (!reply) {
      return res.status(500).json({ message: "Chatbot did not respond." });
    }

    console.log(`[Chatbot] Got reply from Python: "${reply.substring(0, 60)}..."`);

    // 4. Parse JSON from Python (it now sends {reply, suggestions, emotion, confidence})
    let replyText = reply;
    let suggestions = [];
    let emotion = null;
    let confidence = null;
    try {
      const parsed = JSON.parse(reply);
      replyText = parsed.reply || reply;
      suggestions = parsed.suggestions || [];
      emotion = parsed.emotion || null;
      confidence = parsed.confidence || null;
    } catch (_) {
      // Older plain-text fallback — keep as-is
      replyText = reply;
    }

    // 4b. Save encrypted mood if present
    if (emotion && confidence) {
      const { iv: moodIv, encryptedData: encMood } = encrypt(emotion);
      await pool.query(
        "INSERT INTO mood_analysis (user_id, chat_id, emotion, confidence, iv, analyzed_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [req.user.userId, currentChatId, encMood, confidence, moodIv]
      );
    }

    // 5. Save assistant message to DB (store only the reply text, not suggestions)
    const { iv: asstIv, encryptedData: encAsstMsg } = encrypt(replyText);
    await pool.query(
      "INSERT INTO messages (chat_id, sender, content, iv, created_at) VALUES (?, 'assistant', ?, ?, NOW())",
      [currentChatId, encAsstMsg, asstIv]
    );

    res.status(200).json({ chatId: currentChatId, reply: replyText, suggestions });
  } catch (err) {
    console.error("[Chatbot] Error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;
