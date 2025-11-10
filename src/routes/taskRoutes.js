import express from "express";
import {
  createTaskController,
  getTasksController,
  getTaskMessagesController,
  addTaskMessageController,
  assumeTaskController,
  addSupportUserController,
  getTaskSupportController,
  updateTaskController,
  deleteTaskController,
  getTaskByIdController
} from "../controllers/taskController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/ai/message", addTaskMessageController);
router.put("/:taskId", updateTaskController);
router.use(verifyToken);

// ✅ Task CRUD
router.post("/", createTaskController);
router.get("/", getTasksController);

// ✅ Task messages
router.get("/:taskId/messages", getTaskMessagesController);

router.get("/:taskId/full", getTaskByIdController);
router.delete("/:taskId", deleteTaskController);
router.post("/:taskId/messages", addTaskMessageController);

// ✅ Task responsibility/support
router.post("/:taskId/assume", assumeTaskController);
router.post("/:taskId/support", addSupportUserController);
router.get("/:taskId/support", getTaskSupportController);

export default router;
