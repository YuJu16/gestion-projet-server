import { Request, Response, NextFunction } from "express";

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error(err.message);

    const status = err.status || 500;
    res.status(status).json({
        error: err.message || "Erreur interne du serveur",
    });
}