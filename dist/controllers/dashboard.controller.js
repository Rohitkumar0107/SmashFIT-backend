"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const dashboardService = new dashboard_service_1.DashboardService();
const getDashboardSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Query param se status uthao (e.g., ?status=LIVE ya ?status=FINISHED)
        // Agar kuch nahi bheja toh default 'LIVE' matches aayenge
        const statusFilter = req.query.status || 'LIVE';
        // Service ko call karo
        const dashboardData = yield dashboardService.getFullDashboardSummary(statusFilter);
        // Success Response
        return res.status(200).json({
            success: true,
            message: "Dashboard summary fetched successfully",
            data: dashboardData
        });
    }
    catch (error) {
        console.error("❌ Dashboard Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: "Dashboard data load karne mein dikkat aayi.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
exports.getDashboardSummary = getDashboardSummary;
