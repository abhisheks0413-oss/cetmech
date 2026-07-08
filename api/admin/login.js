const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method Not Allowed"
        });
    }

    const { username, password } = req.body;

    const envUser = process.env.ADMIN_USERNAME || "admin";
    const envPass = process.env.ADMIN_PASSWORD || "admin123";

    if (username !== envUser || password !== envPass) {
        return res.status(401).json({
            error: "Invalid username or password"
        });
    }

    const token = jwt.sign(
        { isAdmin: true },
        process.env.JWT_SECRET,
        {
            expiresIn: "24h"
        }
    );

    res.setHeader(
        "Set-Cookie",
        `admin_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
    );

    return res.json({
        success: true
    });
};