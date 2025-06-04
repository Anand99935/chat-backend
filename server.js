const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Message = require('./models/message');
const User = require('./models/user');

const app = express();
const server = http.createServer(app);

// 🔌 Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "https://chat-backend-2-ukox.onrender.com", 
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// 🧩 Middleware
app.use(cors());
app.use(express.json());

// client.connect().then(() => {
//   const db = client.db('chatapp');
//   usersCollection = db.collection('users');
// });

// 🌐 MongoDB connection
mongoose.connect('mongodb+srv://businesskeyutech:86vT98mp3O1oJmM0@cluster0.ramskda.mongodb.net/chatapp?retryWrites=true&w=majority')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.get("/", (req, res) => {
  res.send("💬 Chat backend is running...");
});

// 🔑 LOGIN / REGISTER Endpoint
app.post('/api/login', async (req, res) => {
  const { name, email } = req.body;

  try {
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ name, email });

    if (existingUser) {
      // ✅ Already exists → Login
      return res.status(200).json({ message: 'Login successful', user: existingUser });
    } else {
      // ❇️ New user → Insert
      const result = await usersCollection.insertOne({ name, email });
      return res.status(201).json({ message: 'User registered', user: result.ops[0] });
    }

  } catch (err) {
    console.error("❌ Login DB error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 💬 Get all chat messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// 👥 Get distinct chat users
app.get("/users", async (req, res) => {
  try {
    const users = await Message.distinct("sender");
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 📡 Socket.IO communication
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
