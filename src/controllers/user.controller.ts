import { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await userService.getCurrentUser(userId);
        res.status(200).json(user);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id as string;
        const user = await userService.getUserById(userId);
        res.status(200).json(user);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const targetUserId = req.params.id as string;
        const { fullName, avatarUrl } = req.body;

        const updatedUser = await userService.updateUser(currentUserId, targetUserId, fullName, avatarUrl);
        res.status(200).json(updatedUser);
    } catch (error: any) {
        // Simple distinct between 403 Forbidden and 500
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.listUsers();
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const assignRole = async (req: Request, res: Response) => {
    try {
        const targetUserId = req.params.id as string;
        const { roleName } = req.body;

        const updatedUser = await userService.assignRole(targetUserId, roleName);
        res.status(200).json({ message: "Role assigned successfully", user: updatedUser });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getUserActivity = async (req: Request, res: Response) => {
    try {
        const targetUserId = req.params.id as string;
        // In a real app we might verify if you are allowed to see another user's activity
        const activities = await userService.getUserActivity(targetUserId);
        res.status(200).json(activities);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserNotifications = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const targetUserId = req.params.id as string;

        if (currentUserId !== targetUserId) {
            return res.status(403).json({ message: "Unauthorized to read other users' notifications" });
        }

        const notifications = await userService.getUserNotifications(targetUserId);
        res.status(200).json(notifications);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserSettings = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const targetUserId = req.params.id as string;

        if (currentUserId !== targetUserId) {
            return res.status(403).json({ message: "Unauthorized to read other users' settings" });
        }

        const settings = await userService.getUserSettings(targetUserId);
        res.status(200).json(settings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserSettings = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const targetUserId = req.params.id as string;
        const settings = req.body;

        const updatedSettings = await userService.updateUserSettings(currentUserId, targetUserId, settings);
        res.status(200).json(updatedSettings);
    } catch (error: any) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};