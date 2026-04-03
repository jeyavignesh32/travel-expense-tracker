// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const tripRoutes = require('./routes/trips');
const itineraryRoutes = require('./routes/itinerary');
const pool = require('./db/config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/itinerary', itineraryRoutes);

// Socket.io for Real-time Location Updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-trip', (tripId) => {
    socket.join(`trip-${tripId}`);
    console.log(`User joined trip room: trip-${tripId}`);
  });

  socket.on('update-location', async (data) => {
    const { userId, tripId, latitude, longitude, accuracy, speed, heading } = data;
    io.to(`trip-${tripId}`).emit('location-pulse', { userId, latitude, longitude, timestamp: new Date() });

    try {
      await pool.query(
        'INSERT INTO locations (user_id, trip_id, latitude, longitude, accuracy, speed, heading) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, tripId, latitude, longitude, accuracy, speed, heading]
      );
    } catch (err) {
      console.error('Error persisting location:', err.message);
    }
  });

  socket.on('sos-alert', (data) => {
    const { userId, userName, tripId, latitude, longitude } = data;
    io.to(`trip-${tripId}`).emit('sos-received', { userId, userName, latitude, longitude });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
