import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth";

export async function addParticipant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params;
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({ error: "email ou pseudo requis" });
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        if (project.ownerId !== req.userId) {
            return res.status(403).json({ error: "Seul le propriétaire peut ajouter des participants" });
        }

        const user = identifier.includes("@")
            ? await prisma.user.findUnique({ where: { email: identifier } })
            : await prisma.user.findFirst({ where: { name: identifier } });

        if (!user) {
            return res.status(404).json({ error: "Aucun utilisateur trouvé avec cet email ou ce pseudo" });
        }

        if (user.id === project.ownerId) {
            return res.status(400).json({ error: "Le propriétaire est déjà membre du projet" });
        }

        const existing = await prisma.participant.findUnique({
            where: { userId_projectId: { userId: user.id, projectId } },
        });
        if (existing) {
            return res.status(409).json({ error: "Cet utilisateur est déjà participant" });
        }

        const participant = await prisma.participant.create({
            data: { userId: user.id, projectId },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        res.status(201).json(participant);
    } catch (err) {
        next(err);
    }
}

export async function getParticipants(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { participants: true },
        });
        if (!project) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        const isOwner = project.ownerId === req.userId;
        const isParticipant = project.participants.some((p) => p.userId === req.userId);
        if (!isOwner && !isParticipant) {
            return res.status(403).json({ error: "Accès refusé à ce projet" });
        }

        const participants = await prisma.participant.findMany({
            where: { projectId },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        res.json(participants);
    } catch (err) {
        next(err);
    }
}

export async function removeParticipant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { projectId, participantId } = req.params;

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        const participant = await prisma.participant.findUnique({ where: { id: participantId } });
        if (!participant) {
            return res.status(404).json({ error: "Participant introuvable" });
        }

        const isOwner = project.ownerId === req.userId;
        const isSelf = participant.userId === req.userId;

        if (!isOwner && !isSelf) {
            return res.status(403).json({ error: "Non autorisé à retirer ce participant" });
        }

        await prisma.participant.delete({ where: { id: participantId } });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}