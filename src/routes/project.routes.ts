import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
} from "../controllers/project.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;