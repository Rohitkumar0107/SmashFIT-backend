"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const organization_routes_1 = __importDefault(require("./routes/organization.routes"));
const tournament_routes_1 = __importDefault(require("./routes/tournament.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const match_routes_1 = __importDefault(require("./routes/match.routes"));
const leaderboard_routes_1 = __importDefault(require("./routes/leaderboard.routes"));
const player_routes_1 = __importDefault(require("./routes/player.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const venue_routes_1 = __importDefault(require("./routes/venue.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const notification_routes_1 = __importStar(require("./routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const system_routes_1 = __importDefault(require("./routes/system.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const billing_routes_1 = __importDefault(require("./routes/billing.routes"));
const cors_1 = __importDefault(require("cors"));
const cors_config_1 = require("./config/cors.config");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const match_controller_1 = require("./controllers/match.controller");
const match_controller_2 = require("./controllers/match.controller");
function startServer() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(cors_config_1.corsConfig));
    dotenv_1.default.config();
    app.use((0, cookie_parser_1.default)()); // Cookie parser middleware for handling cookies
    app.use(express_1.default.json());
    // 🟢 2. HTTP Server aur Socket.io initialize karo
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server, {
        cors: cors_config_1.corsConfig, // Tumhara existing CORS config hi use ho jayega yahan
    });
    // 🟢 3. Express app me 'io' ko save karo taaki controllers isey access kar sakein
    app.set("socketio", io);
    // Inject io into match service so score updates trigger WebSocket emits
    (0, match_controller_1.initMatchService)(io);
    // Socket.IO room management for live tournament score feeds
    // Clients emit  { event: 'join_tournament', tournamentId: '<uuid>' }  to subscribe
    io.on("connection", (socket) => {
        console.log("⚡ Socket connected:", socket.id);
        socket.on("join_tournament", (tournamentId) => {
            socket.join(tournamentId);
            console.log(`📡 Socket ${socket.id} joined room: ${tournamentId}`);
        });
        socket.on("leave_tournament", (tournamentId) => {
            socket.leave(tournamentId);
        });
        socket.on("disconnect", () => {
            console.log("🔴 Socket disconnected:", socket.id);
        });
    });
    // Attach route modules
    app.use("/api/auth", auth_routes_1.default);
    app.use("/api/users", user_routes_1.default);
    app.use("/api/organizations", organization_routes_1.default);
    app.use("/api/tournaments", tournament_routes_1.default);
    // Tournament-scoped match sub-routes
    app.get("/api/tournaments/:id/matches", match_controller_2.getTournamentMatches);
    app.post("/api/tournaments/:id/matches/generate", match_controller_2.generateBracket);
    app.use("/api/dashboard", dashboard_routes_1.default);
    //for match routes
    app.use("/api/matches", match_routes_1.default);
    // for leaderboard routes
    app.use("/api/leaderboard", leaderboard_routes_1.default);
    // additional ranking path used by spec
    const { recalculateRanks } = require("./controllers/leaderboard.controller");
    const { verifyAuth } = require("./middlewares/auth.middleware");
    app.post("/api/rankings/recalculate", verifyAuth, recalculateRanks);
    // for player
    app.use("/api/players", player_routes_1.default);
    // for teams
    app.use("/api/teams", team_routes_1.default);
    // for venues
    app.use("/api/venues", venue_routes_1.default);
    // for schedules
    app.use("/api/schedules", schedule_routes_1.default);
    // for analytics
    app.use("/api/analytics", analytics_routes_1.default);
    // dashboard alias - some clients may hit /api/dash
    app.use("/api/dash", dashboard_routes_1.default);
    // for notifications
    app.use("/api/notifications", notification_routes_1.default);
    // for uploads
    app.use("/api/uploads", notification_routes_1.uploadRoutes);
    // for webhooks
    app.use("/api/webhooks", notification_routes_1.webhookRoutes);
    // for admin
    app.use("/api/admin", admin_routes_1.default);
    // for health probes
    app.use("/api/health", health_routes_1.default);
    // for system (privacy, api-keys, settings, search)
    app.use("/api", system_routes_1.default);
    // for payments - mount on both /api/pay and /api/payments to match spec
    app.use("/api/payments", payment_routes_1.default);
    app.use("/api/pay", payment_routes_1.default);
    // for billing
    app.use("/api/billing", billing_routes_1.default);
    // Define a basic route
    app.get("/", (req, res) => {
        res.send("Welcome to Smashit API!");
    });
    // Start the server
    const PORT = process.env.PORT || 5000;
    // 🚨 5. SABSE IMPORTANT: app.listen ko hta kar server.listen karna hai!
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}
