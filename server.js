const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Message = require('./models/message');
const User = require('./models/user');

const app = express();
const server = http.createServer(app);

// ✅ Correct CORS origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://anand99935.github.io"
];

// ✅ Express middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// ✅ Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// ✅ MongoDB connection
mongoose.connect('mongodb+srv://businesskeyutech:86vT98mp3O1oJmM0@cluster0.ramskda.mongodb.net/chatapp?retryWrites=true&w=majority')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
app.get("/", (req, res) => {
  res.send("💬 Chat backend is running...");
});

app.post('/api/login', async (req, res) => {
  const { name, email } = req.body;

  try {
    const existingUser = await User.findOne({ name, email });

    if (existingUser) {
      return res.status(200).json({ success: true, user: existingUser });
    } else {
      const newUser = new User({ name, email });
      const savedUser = await newUser.save();
      return res.status(201).json({ success: true, user: savedUser });
    }

  } catch (err) {
    console.error("❌ Login DB error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await Message.distinct("sender");
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ Socket.IO Chat
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("send-message", async (data) => {
    const { sender, text } = data;

    if (!sender || !text) return;

    const newMessage = new Message({ sender, text });

    try {
      const savedMessage = await newMessage.save();
      io.emit("receive-message", savedMessage);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🚪 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
