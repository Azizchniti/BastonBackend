import express from "express";
import { register, login,getCurrentUser } from "../controllers/authcontroller.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only admins can register new users
//router.post("/register", verifyToken, isAdmin, register);
router.post("/register", register);
// Anyone can log in
router.post("/login", login);
router.get("/me", verifyToken, getCurrentUser);
export default router;
