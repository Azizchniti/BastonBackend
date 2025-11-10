import express from "express";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createUserController,
  getUserTasks,
  getUsersByDepartment,
} from "../controllers/userController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ This route must come BEFORE the dynamic /:id
router.get("/department/:id", verifyToken, getUsersByDepartment);

// ✅ Routes for authenticated users
router.get("/:id/tasks", verifyToken, getUserTasks);
router.get("/:id", verifyToken, getUser);
router.put("/:id", updateUser);
// ✅ The following routes are admin-only
router.use(verifyToken, isAdmin);

router.get("/", getUsers);
router.post("/", createUserController);

router.delete("/:id", deleteUser);

export default router;
