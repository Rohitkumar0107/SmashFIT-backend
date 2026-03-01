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
exports.updateUserSettings = exports.getUserSettings = exports.getUserNotifications = exports.getUserActivity = exports.assignRole = exports.listUsers = exports.updateUser = exports.getUserById = exports.getCurrentUser = void 0;
const user_service_1 = require("../services/user.service");
const userService = new user_service_1.UserService();
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const user = yield userService.getCurrentUser(userId);
        res.status(200).json(user);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
});
exports.getCurrentUser = getCurrentUser;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const user = yield userService.getUserById(userId);
        res.status(200).json(user);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
});
exports.getUserById = getUserById;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.id;
        const { fullName, avatarUrl } = req.body;
        const updatedUser = yield userService.updateUser(currentUserId, targetUserId, fullName, avatarUrl);
        res.status(200).json(updatedUser);
    }
    catch (error) {
        // Simple distinct between 403 Forbidden and 500
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
});
exports.updateUser = updateUser;
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield userService.listUsers();
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.listUsers = listUsers;
const assignRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const targetUserId = req.params.id;
        const { roleName } = req.body;
        const updatedUser = yield userService.assignRole(targetUserId, roleName);
        res.status(200).json({ message: "Role assigned successfully", user: updatedUser });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.assignRole = assignRole;
const getUserActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const targetUserId = req.params.id;
        // In a real app we might verify if you are allowed to see another user's activity
        const activities = yield userService.getUserActivity(targetUserId);
        res.status(200).json(activities);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getUserActivity = getUserActivity;
const getUserNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.id;
        if (currentUserId !== targetUserId) {
            return res.status(403).json({ message: "Unauthorized to read other users' notifications" });
        }
        const notifications = yield userService.getUserNotifications(targetUserId);
        res.status(200).json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getUserNotifications = getUserNotifications;
const getUserSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.id;
        if (currentUserId !== targetUserId) {
            return res.status(403).json({ message: "Unauthorized to read other users' settings" });
        }
        const settings = yield userService.getUserSettings(targetUserId);
        res.status(200).json(settings);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getUserSettings = getUserSettings;
const updateUserSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.id;
        const settings = req.body;
        const updatedSettings = yield userService.updateUserSettings(currentUserId, targetUserId, settings);
        res.status(200).json(updatedSettings);
    }
    catch (error) {
        if (error.message.includes("Unauthorized")) {
            res.status(403).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
});
exports.updateUserSettings = updateUserSettings;
