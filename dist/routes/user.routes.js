"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// Note: Ensure an `isAdmin` middleware is defined in auth.middleware.ts, or verify roles directly inside 
const auth_middleware_2 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All user routes require authentication
router.use(auth_middleware_1.verifyAuth);
// 1. Current user profile
router.get("/me", user_controller_1.getCurrentUser);
// 4. List users (Admin)
// Must be placed before /:id to avoid "me" or string matching issues if not careful, though Express usually handles standard ordering. Let's arrange carefully.
router.get("/", auth_middleware_2.verifyAdmin, user_controller_1.listUsers);
// 2. View a user
router.get("/:id", user_controller_1.getUserById);
// 3. Update profile
router.put("/:id", user_controller_1.updateUser);
// 5. Assign system-level roles (Admin)
router.post("/:id/roles", auth_middleware_2.verifyAdmin, user_controller_1.assignRole);
// 6. User activity feed
router.get("/:id/activity", user_controller_1.getUserActivity);
// 7. User notification history
router.get("/:id/notifications", user_controller_1.getUserNotifications);
// 8. Notification & Privacy preferences (GET is useful to have before PUT)
router.get("/:id/settings", user_controller_1.getUserSettings);
// 8. Notification & Privacy preferences (PUT)
router.put("/:id/settings", user_controller_1.updateUserSettings);
exports.default = router;
