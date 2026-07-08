const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {

    const cookies = Object.fromEntries(
        (req.headers.cookie || "")
            .split(";")
            .map(x => x.trim())
            .filter(Boolean)
            .map(cookie => {
                const index = cookie.indexOf("=");

                return [
                    cookie.slice(0, index),
                    cookie.slice(index + 1)
                ];
            })
    );

    const token = cookies.admin_token;

    if (!token)
        return res.json({
            authenticated: false
        });

    try {

        jwt.verify(token, process.env.JWT_SECRET);

        return res.json({
            authenticated: true
        });

    } catch {

        return res.json({
            authenticated: false
        });

    }

};