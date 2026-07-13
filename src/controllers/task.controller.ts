import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth";

async function checkProjectAccess(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { participants: true },
    });

    if (!project) return null;

    const isOwner = project.ownerId === userId;
    const isParticipant = project.participants.some((p) => p.userId === userId);

    return isOwner || isParticipant ? project : null;
}

export async function createTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params;
        const { title, description, assignedToId } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "title et description sont requis" });
        }

        const project = await checkProjectAccess(projectId, req.userId!);
        if (!project) {
            return res.status(403).json({ error: "Accès refusé à ce projet" });
        }

        // si un assigné est fourni, vérifier que c'est bien un participant (ou le owner)
        if (assignedToId) {
            const isValidAssignee =
                assignedToId === project.ownerId ||
                project.participants.some((p) => p.userId === assignedToId);

            if (!isValidAssignee) {
                return res.status(400).json({ error: "L'utilisateur assigné n'est pas participant du projet" });
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                projectId,
                assignedToId: assignedToId || null,
            },
        });

        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
}

export async function getTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params;
        const { status } = req.query; // filtre optionnel ?status=EN_COURS

        const project = await checkProjectAccess(projectId, req.userId!);
        if (!project) {
            return res.status(403).json({ error: "Accès refusé à ce projet" });
        }

        const tasks = await prisma.task.findMany({
            where: {
                projectId,
                ...(status ? { status: status as any } : {}),
            },
            include: {
                assignedTo: { select: { id: true, name: true, email: true } },
            },
        });

        res.json(tasks);
    } catch (err) {
        next(err);
    }
}

export async function updateTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { taskId } = req.params;
        const { title, description, status, assignedToId } = req.body;

        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            return res.status(404).json({ error: "Tâche introuvable" });
        }

        const project = await checkProjectAccess(task.projectId, req.userId!);
        if (!project) {
            return res.status(403).json({ error: "Accès refusé à ce projet" });
        }

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(status !== undefined && { status }),
                ...(assignedToId !== undefined && { assignedToId }),
            },
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { taskId } = req.params;

        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            return res.status(404).json({ error: "Tâche introuvable" });
        }

        const project = await checkProjectAccess(task.projectId, req.userId!);
        if (!project) {
            return res.status(403).json({ error: "Accès refusé à ce projet" });
        }

        await prisma.task.delete({ where: { id: taskId } });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}