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
exports.UserService = void 0;
const user_repository_1 = require("../repositories/user.repository");
class UserService {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    getCurrentUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.getUserById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.getUserById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    updateUser(userId, targetUserId, fullName, avatarUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            // Business logic: Users can only update their own profile unless they are admins.
            // For now, ensuring strict self-update.
            if (userId !== targetUserId) {
                throw new Error("Unauthorized to update other user profiles");
            }
            return yield this.userRepository.updateUser(targetUserId, fullName, avatarUrl);
        });
    }
    listUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            // In a real app we'd add paging inputs, sorting, filters here
            return yield this.userRepository.listUsers();
        });
    }
    assignRole(targetUserId, roleName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Business logic wrapper for granting roles (ensuring correct strings, emitting events, etc)
            const validRoles = ["Admin", "Player", "Coach", "Venue Owner"]; // Example mapping
            if (!validRoles.includes(roleName)) {
                throw new Error("Invalid role name assignment");
            }
            return yield this.userRepository.assignRole(targetUserId, roleName);
        });
    }
    getUserActivity(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.getUserActivity(userId);
        });
    }
    getUserNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.getUserNotifications(userId);
        });
    }
    getUserSettings(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.getUserSettings(userId);
        });
    }
    updateUserSettings(userId, targetUserId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (userId !== targetUserId) {
                throw new Error("Unauthorized to update other user settings");
            }
            // Validate settings object
            const allowedThemes = ['light', 'dark', 'system'];
            const allowedVisibility = ['public', 'private', 'friends'];
            const sanitizedSettings = {};
            if (settings.email_notifications !== undefined)
                sanitizedSettings.email_notifications = !!settings.email_notifications;
            if (settings.push_notifications !== undefined)
                sanitizedSettings.push_notifications = !!settings.push_notifications;
            if (settings.profile_visibility && allowedVisibility.includes(settings.profile_visibility)) {
                sanitizedSettings.profile_visibility = settings.profile_visibility;
            }
            if (settings.theme && allowedThemes.includes(settings.theme)) {
                sanitizedSettings.theme = settings.theme;
            }
            return yield this.userRepository.updateUserSettings(targetUserId, sanitizedSettings);
        });
    }
}
exports.UserService = UserService;
