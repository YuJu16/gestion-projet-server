import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth";

export async function createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "title et description sont requis" });
        }

        const project = await prisma.project.create({
            data: {
                title,
                description,
                ownerId: req.userId!,
            },
        });

        res.status(201).json(project);
    } catch (err) {
        next(err);
    }
}

export async function getProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { ownerId: req.userId },
                    { participants: { some: { userId: req.userId } } },
                ],
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                participants: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
        });

        res.json(projects);
    } catch (err) {
        next(err);
    }
}

export async function getProjectById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                participants: { include: { user: { select: { id: true, name: true, email: true } } } },
                tasks: true,
            },
        });

        if (!project) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        res.json(project);
    } catch (err) {
        next(err);
    }
}

export async function updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const project = await prisma.project.findUnique({ where: { id: req.params.id } });

        if (!project) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        if (project.ownerId !== req.userId) {
            return res.status(403).json({ error: "Seul le propriétaire peut modifier ce projet" });
        }

        const { title, description } = req.body;

        const updated = await prisma.project.update({
            where: { id: req.params.id },
            data: { title, description },
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

export async function deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const project = await prisma.project.findUnique({ where: { id: req.params.id } });

        if (!project) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        if (project.ownerId !== req.userId) {
            return res.status(403).json({ error: "Seul le propriétaire peut supprimer ce projet" });
        }

        await prisma.task.deleteMany({ where: { projectId: req.params.id } });
        await prisma.participant.deleteMany({ where: { projectId: req.params.id } });
        await prisma.project.delete({ where: { id: req.params.id } });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}