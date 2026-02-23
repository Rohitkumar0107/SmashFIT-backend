// src/config/cors.config.ts
import { CorsOptions } from 'cors';

// Yahan apne saare allowed frontends daal sakte ho
// Abhi ke liye Vite ka local address daala hai
const allowedOrigins = [
    'http://localhost:5173', // Tera React Vite app
    // 'https://smashit.com', // Future production URL yahan aayega
];

export const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
        // Agar request server-to-server hai (origin undefined) ya allowed list mein hai, toh pass hone do
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS Policy: Ye origin allowed nahi hai!'));
        }
    },
    credentials: true, // 🔥 SUPER IMPORTANT: Iske bina frontend cookies (Refresh Token) send/receive nahi kar payega!
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};