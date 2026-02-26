import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

const dashboardService = new DashboardService();

export const getDashboardSummary = async (req: Request, res: Response) => {
    try {
        // Query param se status uthao (e.g., ?status=LIVE ya ?status=FINISHED)
        // Agar kuch nahi bheja toh default 'LIVE' matches aayenge
        const statusFilter = (req.query.status as string) || 'LIVE';

        // Service ko call karo
        const dashboardData = await dashboardService.getFullDashboardSummary(statusFilter);

        // Success Response
        return res.status(200).json({
            success: true,
            message: "Dashboard summary fetched successfully",
            data: dashboardData
        });

    } catch (error: any) {
        console.error("❌ Dashboard Controller Error:", error);

        return res.status(500).json({
            success: false,
            message: "Dashboard data load karne mein dikkat aayi.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};