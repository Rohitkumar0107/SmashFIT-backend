import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import organizationRoutes from "./routes/organization.routes";
import tournamentRoutes from "./routes/tournament.routes";
import userRoutes from "./routes/user.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import matchRoutes from "./routes/match.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import playerRoutes from "./routes/player.routes";
import teamRoutes from "./routes/team.routes";
import venueRoutes from "./routes/venue.routes";
import scheduleRoutes from "./routes/schedule.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes, {
  uploadRoutes,
  webhookRoutes,
} from "./routes/notification.routes";
import adminRoutes from "./routes/admin.routes";
import healthRoutes from "./routes/health.routes";
import systemRoutes from "./routes/system.routes";
import paymentRoutes from "./routes/payment.routes";
import billingRoutes from "./routes/billing.routes";
import cors from "cors";
import { corsConfig } from "./config/cors.config";
import http from "http";
import { Server } from "socket.io";
import { initMatchService } from "./controllers/match.controller";
import {
  getTournamentMatches,
  generateBracket,
} from "./controllers/match.controller";

export function startServer() {
  const app = express();
  app.use(cors(corsConfig));
  dotenv.config();
  app.use(cookieParser()); // Cookie parser middleware for handling cookies

  app.use(express.json());

  // 🟢 2. HTTP Server aur Socket.io initialize karo
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: corsConfig, // Tumhara existing CORS config hi use ho jayega yahan
  });

  // 🟢 3. Express app me 'io' ko save karo taaki controllers isey access kar sakein
  app.set("socketio", io);

  // Inject io into match service so score updates trigger WebSocket emits
  initMatchService(io);

  // Socket.IO room management for live tournament score feeds
  // Clients emit  { event: 'join_tournament', tournamentId: '<uuid>' }  to subscribe
  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);

    socket.on("join_tournament", (tournamentId: string) => {
      socket.join(tournamentId);
      console.log(`📡 Socket ${socket.id} joined room: ${tournamentId}`);
    });

    socket.on("leave_tournament", (tournamentId: string) => {
      socket.leave(tournamentId);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  // Attach route modules
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/tournaments", tournamentRoutes);
  // Tournament-scoped match sub-routes
  app.get("/api/tournaments/:id/matches", getTournamentMatches);
  app.post("/api/tournaments/:id/matches/generate", generateBracket);
  app.use("/api/dashboard", dashboardRoutes);

  //for match routes
  app.use("/api/matches", matchRoutes);

  // for leaderboard routes
  app.use("/api/leaderboard", leaderboardRoutes);
  // additional ranking path used by spec
  const { recalculateRanks } = require("./controllers/leaderboard.controller");
  const { verifyAuth } = require("./middlewares/auth.middleware");
  app.post("/api/rankings/recalculate", verifyAuth, recalculateRanks);

  // for player
  app.use("/api/players", playerRoutes);
  // for teams
  app.use("/api/teams", teamRoutes);
  // for venues
  app.use("/api/venues", venueRoutes);
  // for schedules
  app.use("/api/schedules", scheduleRoutes);
  // for analytics
  app.use("/api/analytics", analyticsRoutes);

  // dashboard alias - some clients may hit /api/dash
  app.use("/api/dash", dashboardRoutes);
  // for notifications
  app.use("/api/notifications", notificationRoutes);
  // for uploads
  app.use("/api/uploads", uploadRoutes);
  // for webhooks
  app.use("/api/webhooks", webhookRoutes);
  // for admin
  app.use("/api/admin", adminRoutes);
  // for health probes
  app.use("/api/health", healthRoutes);
  // for system (privacy, api-keys, settings, search)
  app.use("/api", systemRoutes);
  // for payments - mount on both /api/pay and /api/payments to match spec
  app.use("/api/payments", paymentRoutes);
  app.use("/api/pay", paymentRoutes);
  // for billing
  app.use("/api/billing", billingRoutes);

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