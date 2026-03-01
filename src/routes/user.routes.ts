import { Router } from "express";
import {
    getCurrentUser,
    getUserById,
    updateUser,
    listUsers,
    assignRole,
    getUserActivity,
    getUserNotifications,
    getUserSettings,
    updateUserSettings
} from "../controllers/user.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

// Note: Ensure an `isAdmin` middleware is defined in auth.middleware.ts, or verify roles directly inside 
import { verifyAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All user routes require authentication
router.use(verifyAuth);

// 1. Current user profile
router.get("/me", getCurrentUser);

// 4. List users (Admin)
// Must be placed before /:id to avoid "me" or string matching issues if not careful, though Express usually handles standard ordering. Let's arrange carefully.
router.get("/", verifyAdmin, listUsers);

// 2. View a user
router.get("/:id", getUserById);

// 3. Update profile
router.put("/:id", updateUser);

// 5. Assign system-level roles (Admin)
router.post("/:id/roles", verifyAdmin, assignRole);

// 6. User activity feed
router.get("/:id/activity", getUserActivity);

// 7. User notification history
router.get("/:id/notifications", getUserNotifications);

// 8. Notification & Privacy preferences (GET is useful to have before PUT)
router.get("/:id/settings", getUserSettings);

// 8. Notification & Privacy preferences (PUT)
router.put("/:id/settings", updateUserSettings);

export default router;