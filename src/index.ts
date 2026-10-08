import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import jwt from "jsonwebtoken";
import express from "express";

import cors from "cors";
import bcrypt from "bcryptjs";
import fs from "fs";

import { db } from "./db.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

const app = express();

app.use(cors({
    origin: [
        "https://astc.joyit.io",
        "https://astc-api.joyit.io",
        "https://astc-auth.joyit.io",
        "https://auth-api.astc.joyit.io",
        "https://attendance.joyit.io",
        "https://astc-backoffice.joyit.io",
        "https://astc-project.joyit.io",
        "https://minio.astc.joyit.io",
        "https://minio-s3.astc.joyit.io",
        "https://astc.joyit.io:8443",
        "https://astc-api.joyit.io:8443",
        "https://astc-auth.joyit.io:8443",
        "https://attendance.joyit.io:8443",
        "https://astc-backoffice.joyit.io:8443",
        "https://astc-project.joyit.io:8443"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const privateKey = fs.readFileSync("private.pem");

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
    const tStart = Date.now();
    try {

        console.log("============== LOGIN REQUEST ==============");
        console.log("[AUTH PERF] Login request started");

        const { email, password } = req.body;

        const tDbStart = Date.now();
        const user = await db.user.findUnique({
            where: { email },
            include: { role: true }
        });
        console.log(`[AUTH PERF] Database user lookup took ${Date.now() - tDbStart} ms`);

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const tPasswordStart = Date.now();
        const valid = await bcrypt.compare(
            password,
            user.password_hash
        );
        const tPasswordDuration = Date.now() - tPasswordStart;
        console.log(`[AUTH PERF] Password validation duration = ${tPasswordDuration} ms`);

        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

let avatarUrl = user.avatar_url || "";
        const s3Public = process.env.S3_PUBLIC_ENDPOINT || "https://minio-s3.astc.joyit.io";
        if (avatarUrl.includes("http://minio:9000") || avatarUrl.includes("astc.local")) {
            avatarUrl = avatarUrl.replace("http://minio:9000", s3Public).replace("https://minio-s3.astc.local", s3Public).replace("http://minio-s3.astc.local", s3Public);
        }

        const tJwtStart = Date.now();
        // ðŸ”¥ JWT RS256 (MISMO PAYLOAD, SOLO CAMBIA FIRMA)
        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: avatarUrl,
                role: user.role.code,
                groups: [user.role.code]
            },
            privateKey,
            {
                algorithm: "RS256",
                expiresIn: "24h",
                issuer: "better-auth-verify"
            }
        );
        const tJwtDuration = Date.now() - tJwtStart;
        console.log(`[AUTH PERF] JWT generation duration = ${tJwtDuration} ms`);
        
        console.log(`[AUTH PERF] Total login backend duration = ${Date.now() - tStart} ms`);

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: avatarUrl,
                role: {
                    id: user.role.id,
                    code: user.role.code,
                    name: user.role.name
                }
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

/* =========================
   ME (PROTEGIDO)
========================= */
app.get("/me", authMiddleware, (req, res) => {
    return res.json({
        user: (req as any).user
    });
});

// Warm up the database connection pool on startup to eliminate cold starts
db.$connect()
    .then(() => console.log("âš¡ [AUTH] Prisma Client successfully connected to Database"))
    .catch((err) => console.error("âŒ [AUTH] Prisma connection error during startup warmup:", err));

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
    console.log(`Better Auth running on ${PORT}`);
});


