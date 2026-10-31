
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const DATA_DIR = path.join(ROOT, "data");
const DATABASE_FILE = path.join(DATA_DIR, "videos.json");

const VIDEO_EXTENSIONS = new Set([
    ".mp4",
    ".webm",
    ".mov",
    ".mkv",
    ".avi"
]);

const IMAGE_EXTENSIONS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
]);

for (const directory of [PUBLIC_DIR, UPLOAD_DIR, DATA_DIR])
{
    fs.mkdirSync(directory, { recursive: true });
}

if (!process.env.DISCORD_CLIENT_ID ||
    !process.env.DISCORD_CLIENT_SECRET ||
    !process.env.DISCORD_REDIRECT_URI ||
    !process.env.SESSION_SECRET)
{
    console.error("Missing required environment variables.");
    process.exit(1);
}

if (IS_PRODUCTION && process.env.SESSION_SECRET.length < 32)
{
    console.error("SESSION_SECRET must contain at least 32 characters.");
    process.exit(1);
}

if (IS_PRODUCTION)
{
    app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https://cdn.discordapp.com"],
            mediaSrc: ["'self'", "blob:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
        }
    }
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
    name: "videoshare.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));

app.use((req, res, next) =>
{
    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method))
    {
        const origin = req.get("origin");

        if (origin)
        {
            try
            {
                if (new URL(origin).host !== req.get("host"))
                {
                    return res.status(403).json({
                        error: "Invalid request origin."
                    });
                }
            }
            catch
            {
                return res.status(403).json({
                    error: "Invalid request origin."
                });
            }
        }
    }

    next();
});

async function readVideos()
{
    try
    {
        const content = await fsp.readFile(DATABASE_FILE, "utf8");
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [];
    }
    catch (error)
    {
        if (error.code === "ENOENT")
        {
            await fsp.writeFile(DATABASE_FILE, "[]", "utf8");
            return [];
        }

        throw error;
    }
}

async function writeVideos(videos)
{
    const temporaryFile = `${DATABASE_FILE}.${crypto.randomUUID()}.tmp`;

    await fsp.writeFile(
        temporaryFile,
        JSON.stringify(videos, null, 2),
        "utf8"
    );

    await fsp.rename(temporaryFile, DATABASE_FILE);
}

function requireAuth(req, res, next)
{
    if (!req.session.user)
    {
        return res.status(401).json({
            error: "Authentication required."
        });
    }

    next();
}

function safeName(value)
{
    return String(value || "")
        .trim()
        .replace(/[<>]/g, "")
        .slice(0, 24);
}

function getDiscordAvatar(user)
{
    if (user.avatar)
    {
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
    }

    const discriminator = Number(user.discriminator) || 0;
    return `https://cdn.discordapp.com/embed/avatars/${discriminator % 6}.png`;
}

function publicUser(user)
{
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar
    };
}

function asyncRoute(handler)
{
    return (req, res, next) =>
    {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

const storage = multer.diskStorage({
    destination: (req, file, callback) =>
    {
        callback(null, UPLOAD_DIR);
    },
    filename: (req, file, callback) =>
    {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${crypto.randomUUID()}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_VIDEO_SIZE,
        files: 2
    },
    fileFilter: (req, file, callback) =>
    {
        const extension = path.extname(file.originalname).toLowerCase();

        if (file.fieldname === "video")
        {
            if (!VIDEO_EXTENSIONS.has(extension))
            {
                return callback(new Error("Unsupported video extension."));
            }

            return callback(null, true);
        }

        if (file.fieldname === "thumbnail")
        {
            if (!IMAGE_EXTENSIONS.has(extension))
            {
                return callback(new Error("Unsupported image extension."));
            }

            return callback(null, true);
        }

        callback(new Error("Unexpected upload field."));
    }
});

app.get("/auth/discord", (req, res, next) =>
{
    const state = crypto.randomBytes(32).toString("hex");

    req.session.oauthState = state;

    req.session.save(error =>
    {
        if (error) return next(error);

        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
            response_type: "code",
            scope: "identify",
            state
        });

        res.redirect(
            `https://discord.com/oauth2/authorize?${params.toString()}`
        );
    });
});

app.get("/auth/discord/callback", asyncRoute(async (req, res) =>
{
    const { code, state, error } = req.query;

    if (error)
    {
        return res.redirect("/?login=cancelled");
    }

    if (
        typeof code !== "string" ||
        typeof state !== "string" ||
        !req.session.oauthState ||
        state !== req.session.oauthState
    )
    {
        return res.status(400).send("Invalid OAuth state.");
    }

    delete req.session.oauthState;

    const tokenResponse = await fetch(
        "https://discord.com/api/oauth2/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI
            })
        }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token)
    {
        return res.status(401).send("Discord authentication failed.");
    }

    const userResponse = await fetch(
        "https://discord.com/api/users/@me",
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const discordUser = await userResponse.json();

    if (!userResponse.ok || !discordUser.id)
    {
        return res.status(401).send("Unable to retrieve Discord account.");
    }

    const user = {
        id: discordUser.id,
        username: discordUser.username,
        displayName: discordUser.global_name || discordUser.username,
        avatar: getDiscordAvatar(discordUser)
    };

    await new Promise((resolve, reject) =>
    {
        req.session.regenerate(error =>
        {
            if (error) reject(error);
            else resolve();
        });
    });

    req.session.user = user;

    await new Promise((resolve, reject) =>
    {
        req.session.save(error =>
        {
            if (error) reject(error);
            else resolve();
        });
    });

    res.redirect("/");
}));

app.get("/api/me", (req, res) =>
{
    if (!req.session.user)
    {
        return res.status(401).json({
            error: "Not logged in."
        });
    }

    res.json({
        user: publicUser(req.session.user)
    });
});

app.patch("/api/me", requireAuth, asyncRoute(async (req, res) =>
{
    const displayName = safeName(req.body.displayName);

    if (displayName.length < 2)
    {
        return res.status(400).json({
            error: "Display name must contain at least 2 characters."
        });
    }

    req.session.user.displayName = displayName;

    await new Promise((resolve, reject) =>
    {
        req.session.save(error =>
        {
            if (error) reject(error);
            else resolve();
        });
    });

    res.json({
        user: publicUser(req.session.user)
    });
}));

app.get("/api/videos", asyncRoute(async (req, res) =>
{
    const videos = await readVideos();

    const result = videos
        .map(video => ({
            id: video.id,
            title: video.title,
            filename: video.filename,
            url: `/uploads/${encodeURIComponent(video.filename)}`,
            thumbnailUrl: video.thumbnail
                ? `/uploads/${encodeURIComponent(video.thumbnail)}`
                : null,
            duration: video.duration,
            size: video.size,
            ownerId: video.ownerId,
            uploaderName: video.uploaderName,
            uploaderAvatar: video.uploaderAvatar,
            createdAt: video.createdAt
        }))
        .sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

    res.json({
        videos: result
    });
}));

app.post(
    "/api/videos",
    requireAuth,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    asyncRoute(async (req, res) =>
    {
        const videoFile = req.files?.video?.[0];
        const thumbnailFile = req.files?.thumbnail?.[0];

        if (!videoFile)
        {
            return res.status(400).json({
                error: "Video file is required."
            });
        }

        const title = String(req.body.title || "")
            .trim()
            .slice(0, 100) || "Untitled video";

        const duration = Math.max(
            0,
            Math.min(Number(req.body.duration) || 0, 86400)
        );

        const videos = await readVideos();

        const video = {
            id: crypto.randomUUID(),
            title,
            filename: videoFile.filename,
            thumbnail: thumbnailFile?.filename || null,
            duration,
            size: videoFile.size,
            ownerId: req.session.user.id,
            uploaderName: req.session.user.displayName,
            uploaderAvatar: req.session.user.avatar,
            createdAt: new Date().toISOString()
        };

        videos.push(video);
        await writeVideos(videos);

        res.status(201).json({
            video: {
                ...video,
                url: `/uploads/${encodeURIComponent(video.filename)}`,
                thumbnailUrl: video.thumbnail
                    ? `/uploads/${encodeURIComponent(video.thumbnail)}`
                    : null
            }
        });
    })
);

app.delete(
    "/api/videos/:id",
    requireAuth,
    asyncRoute(async (req, res) =>
    {
        const videos = await readVideos();
        const video = videos.find(item => item.id === req.params.id);

        if (!video)
        {
            return res.status(404).json({
                error: "Video not found."
            });
        }

        if (video.ownerId !== req.session.user.id)
        {
            return res.status(403).json({
                error: "You cannot delete this video."
            });
        }

        const updatedVideos = videos.filter(
            item => item.id !== req.params.id
        );

        await writeVideos(updatedVideos);

        const filesToDelete = [
            video.filename,
            video.thumbnail
        ].filter(Boolean);

        for (const filename of filesToDelete)
        {
            const filePath = path.join(UPLOAD_DIR, filename);

            try
            {
                await fsp.unlink(filePath);
            }
            catch (error)
            {
                if (error.code !== "ENOENT") throw error;
            }
        }

        res.json({
            success: true
        });
    })
);

app.get("/auth/logout", (req, res, next) =>
{
    req.session.destroy(error =>
    {
        if (error) return next(error);

        res.clearCookie("videoshare.sid", {
            httpOnly: true,
            secure: IS_PRODUCTION,
            sameSite: "lax
        });

        res.redirect("/");
    });
});

app.use(
    "/uploads",
    express.static(UPLOAD_DIR, {
        fallthrough: false,
        dotfiles: "deny",
        index: false,
        setHeaders: (res, filePath) =>
        {
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Cache-Control", "public, max-age=3600");
        }
    })
);

app.use(express.static(PUBLIC_DIR));

app.use((error, req, res, next) =>
{
    console.error(error);

    if (res.headersSent) return next(error);

    if (error instanceof multer.MulterError)
    {
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Video exceeds the 500 MB limit."
            : "Upload failed.";

        return res.status(400).json({ error: message });
    }

    if (error.message?.includes("Unsupported") ||
        error.message?.includes("Unexpected"))
    {
        return res.status(400).json({
            error: error.message
        });
    }

    res.status(500).json({
        error: "Internal server error."
    });
});

app.listen(PORT, () =>
{
    console.log(`VideoShare running at http://localhost:${PORT}`);
});
