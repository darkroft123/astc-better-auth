import jwt from "jsonwebtoken";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

const publicKey = fs.readFileSync("public.pem");

export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        console.log("AUTH MIDDLEWARE START");

        const header = req.headers.authorization;

        if (!header) {
            return res.status(401).json({ message: "No token" });
        }

        const token = header.split(" ")[1];

        const decoded = jwt.verify(token, publicKey, {
            algorithms: ["RS256"],
            issuer: "better-auth-verify"
        });

        (req as any).user = decoded;

        console.log("DECODED TOKEN:", decoded);

        next();

    } catch (err) {
        console.error("AUTH ERROR:", err);
        return res.status(401).json({ message: "Invalid token" });
    }
}