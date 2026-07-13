import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { createTask, getTasks, updateTask, deleteTask } from "../controllers/task.controller";

const router = Router({ mergeParams: true }); // pour récupérer :projectId depuis le parent

router.use(requireAuth);

router.post("/", createTask);
router.get("/", getTasks);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;