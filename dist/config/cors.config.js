"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsConfig = void 0;
// Yahan apne saare allowed frontends daal sakte ho
// Abhi ke liye Vite ka local address daala hai
const allowedOrigins = [
    'http://localhost:5173', // Tera React Vite app
    'https://smash-fit-frontend.vercel.app',
    'https://smash-fit-frontend-4f6ce0qlu.vercel.app',
    'https://smash-fit-frontend-git-main-rohitkumar964930-gmailcoms-projects.vercel.app'
];
exports.corsConfig = {
    origin: (origin, callback) => {
        // Agar request server-to-server hai (origin undefined) ya allowed list mein hai, toh pass hone do
        // console.log("🚀 Request from Origin:", origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Blocked by CORS Policy: Ye origin allowed nahi hai!'));
        }
    },
    credentials: true, // 🔥 SUPER IMPORTANT: Iske bina frontend cookies (Refresh Token) send/receive nahi kar payega!
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
