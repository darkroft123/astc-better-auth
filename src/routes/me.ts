import express, { Request, Response } from "express";

export const meRoute = express.Router();

/* =========================
   GET /me
========================= */
meRoute.get("/", (req: Request, res: Response) => {

    console.log("ME ROUTE HIT");

    return res.json({
        user: (req as any).user
    });
});