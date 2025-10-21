import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import landParcelRoutes from "./routes/landParcelRoutes.js";
import soilHealthRoutes from "./routes/soilHealthRoutes.js";
import restorationRoutes from "./routes/restorationRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/land-parcels", landParcelRoutes);
app.use("/api/soil-health", soilHealthRoutes);
app.use("/api/restoration", restorationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/alerts", alertRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
