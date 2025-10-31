import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import landParcelRoutes from "./routes/landParcelRoutes.js";
import soilHealthRoutes from "./routes/soilHealthRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import restorationRoutes from "./routes/restorationRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import imageAnalysisRoutes from "./routes/imageAnalysisRoutes.js";
import backgroundProcessingRoutes from "./routes/backgroundProcessingRoutes.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Make io available in routes
app.set('io', io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/land-parcels", landParcelRoutes);
app.use("/api/soil-health", soilHealthRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/restoration", restorationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/image-analysis", imageAnalysisRoutes);
app.use("/api/background-processing", backgroundProcessingRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "TerraLink API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join parcel room for real-time updates
  socket.on('joinParcel', (parcelId) => {
    socket.join(`parcel_${parcelId}`);
    console.log(`Client ${socket.id} joined parcel_${parcelId}`);
  });

  // Leave parcel room
  socket.on('leaveParcel', (parcelId) => {
    socket.leave(`parcel_${parcelId}`);
    console.log(`Client ${socket.id} left parcel_${parcelId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
