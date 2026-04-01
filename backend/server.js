const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");
const app = express();
const cors = require("cors")
const chatbotRoute = require("./chatbotTest")
const auth = require("./auth/auth")
const uploadRoute = require("./auth/upload")
const moodRoute = require("./mood/mood")
const therapistsRoute = require("./therapists/therapists")
const chatsRoute = require("./chats/chats")
const notesRoute = require("./notes/notes")
const diaryRoute = require("./diary/diary")
const sttRoute = require("./chatbot/stt")
const pool = require("./database/DB");
const { encrypt } = require("./utils/encryption");

const PORT = process.env.DB_PORT || 3000;
// ─── Auto-start Flask note-taking service ────────────────────────────────────
const FLASK_DIR = path.join(__dirname, 'note-taking');
const flaskProcess = spawn('python', ['flask_app.py'], {
    cwd: FLASK_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
    }
});

flaskProcess.stdout.on('data', (d) => process.stdout.write(`[Flask] ${d}`));
flaskProcess.stderr.on('data', (d) => process.stderr.write(`[Flask] ${d}`));
flaskProcess.on('error', (err) => console.error('[Flask] Failed to start:', err.message));
flaskProcess.on('close', (code) => console.log(`[Flask] Process exited with code ${code}`));

// Ensure Flask is killed when Node exits (including nodemon restarts)
process.on('exit', () => flaskProcess.kill());
process.on('SIGINT', () => { flaskProcess.kill(); process.exit(); });
process.on('SIGTERM', () => { flaskProcess.kill(); process.exit(); });
console.log('[Flask] Note-taking service starting...');
// ─────────────────────────────────────────────────────────────────────────────

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/auth", auth)
app.use("/upload", uploadRoute)
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/chatbot", chatbotRoute)
app.use("/mood", moodRoute)
app.use("/therapists", therapistsRoute)
app.use("/chats", chatsRoute)
app.use("/notes", notesRoute)
app.use("/diary", diaryRoute)
app.use("/stt", sttRoute)

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"]
    }
});

// Real-time Chat Logic
io.on("connection", (socket) => {
    console.log(`User connected to Socket.io: ${socket.id}`);

    // Join a specific room based on the two user IDs (e.g., room "10-25")
    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    // Handle sending message
    socket.on("send_message", async (data) => {
        const { sender_id, receiver_id, message, room } = data;

        try {
            // Encrypt message for storage
            const { iv, encryptedData } = encrypt(message);

            // Save to database
            const [result] = await pool.query(
                "INSERT INTO chats(sender_id, receiver_id, message, created_at, iv) VALUES (?, ?, ?, NOW(), ?)",
                [sender_id, receiver_id, encryptedData, iv]
            );

            const insertedMsg = {
                id: result.insertId,
                sender_id,
                receiver_id,
                message: message, // broadcasting plain text since frontend doesn't have the key
                created_at: new Date().toISOString()
            };

            // Broadcast to everyone in the room (including sender to confirm receipt if desired, 
            // but we can also use io.to to send to everyone)
            io.to(room).emit("receive_message", insertedMsg);

        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})