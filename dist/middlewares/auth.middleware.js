"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = exports.requireRole = exports.verifyAuth = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const verifyAuth = (req, res, next) => {
    try {
        // 1. Token nikalna (Header aam taur par "Bearer <token>" format mein hota hai)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({ message: "Access Denied. No token provided." });
        }
        const token = authHeader.split(" ")[1];
        // 2. Token Verify karna (Jo utils humne pehle banaye the)
        // 'as any' ya apna custom interface lagao
        const decodedUser = (0, jwt_utils_1.verifyToken)(token);
        req.user = decodedUser;
        // 3. User ka data request mein daal do taaki aage controllers use kar sakein
        req.user = decodedUser;
        // 4. Sab sahi hai, aage badho (Controller ke paas jao)
        next();
    }
    catch (error) {
        // Agar token expire ho gaya hai ya galat hai
        return res.status(401).json({ message: "Invalid or Expired Token." });
    }
};
exports.verifyAuth = verifyAuth;
// 2. NAYA: requireRole (Authorization)
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // Middleware check: Kya user authenticated hai?
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "Bhai, pehle login toh kar lo!" });
        }
        // Token se 'role' nikalna (token ya DB dono se aa sakta hai)
        const maybeRole = req.user.role || req.user.role_name;
        const userRole = typeof maybeRole === "string" ? maybeRole.toUpperCase() : maybeRole;
        // Check karo ki user ka role allowed list mein hai ya nahi (case-insensitive)
        const allowedUpper = allowedRoles.map((r) => r.toUpperCase());
        if (!allowedUpper.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Denied! Ye sirf ${allowedRoles.join(" or ")} ke liye hai.`,
            });
        }
        // Sab sahi hai, aage badho
        next();
    };
};
exports.requireRole = requireRole;
// 3. NAYA: verifyAdmin helper function
exports.verifyAdmin = (0, exports.requireRole)(["Admin"]);
