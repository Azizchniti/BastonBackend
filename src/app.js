import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authroutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js"; 
import setupRoute from "./routes/setupRoute.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Auth routes
app.use("/api/auth", authRoutes);

// ✅ User routes
app.use("/api/users", userRoutes);

// ✅ Task routes
app.use("/api/tasks", taskRoutes);


app.use("/setup", setupRoute);

app.get("/", (req, res) => {
  res.send("Internal Platform API is running 🚀");
});

export default app;
