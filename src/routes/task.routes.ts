import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { createTask, getTasks, updateTask, deleteTask, setTaskAssignees } from "../controllers/task.controller";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/", createTask);
router.get("/", getTasks);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);
router.put("/:taskId/assignees", setTaskAssignees);

export default router;