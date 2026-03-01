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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class UserRepository {
    // 1. Get Current User Profile
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`SELECT u.id, u.full_name, u.email, u.avatar_url, u.created_at, r.name as role_name
             FROM sm.users u
             LEFT JOIN sm.roles r ON u.role_id = r.id
             WHERE u.id = $1`, [userId]);
            return result.rows[0];
        });
    }
    // 2. Update Profile
    updateUser(userId, fullName, avatarUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            let updateQuery = 'UPDATE sm.users SET ';
            const values = [];
            let i = 1;
            if (fullName) {
                updateQuery += `full_name = $${i}, `;
                values.push(fullName);
                i++;
            }
            if (avatarUrl) {
                updateQuery += `avatar_url = $${i}, `;
                values.push(avatarUrl);
                i++;
            }
            if (values.length === 0)
                return this.getUserById(userId);
            // Remove trailing comma and space
            updateQuery = updateQuery.slice(0, -2);
            updateQuery += ` WHERE id = $${i} RETURNING id, full_name, email, avatar_url`;
            values.push(userId);
            const result = yield db_1.default.query(updateQuery, values);
            return result.rows[0];
        });
    }
    // 3. List Users (Admin)
    listUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            // Leaving pagination extremely simple for now. 
            const result = yield db_1.default.query(`SELECT u.id, u.full_name, u.email, u.avatar_url, u.created_at, r.name as role_name
             FROM sm.users u
             LEFT JOIN sm.roles r ON u.role_id = r.id
             ORDER BY u.created_at DESC`);
            return result.rows;
        });
    }
    // 4. Assign Roles (Admin)
    assignRole(userId, roleName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find role id first
            const roleResult = yield db_1.default.query(`SELECT id FROM sm.roles WHERE name = $1`, [roleName]);
            if (roleResult.rowCount === 0)
                throw new Error("Role not found");
            const roleId = roleResult.rows[0].id;
            const result = yield db_1.default.query(`UPDATE sm.users SET role_id = $1 WHERE id = $2 RETURNING id, full_name, email`, [roleId, userId]);
            return result.rows[0];
        });
    }
    // 5. Activity Feed
    getUserActivity(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`SELECT id, action_type, description, created_at 
             FROM sm.user_activities 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`, [userId]);
            return result.rows;
        });
    }
    // 6. Notification History
    getUserNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.query(`SELECT id, title, body as message, is_read, created_at 
             FROM sm.notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`, [userId]);
            return result.rows;
        });
    }
    // 7. Get user settings
    getUserSettings(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield db_1.default.query(`SELECT email_notifications, push_notifications, profile_visibility, theme 
             FROM sm.user_settings 
             WHERE user_id = $1`, [userId]);
            // Return default values if setting hasn't been set yet
            if (result.rowCount === 0) {
                return {
                    email_notifications: true,
                    push_notifications: true,
                    profile_visibility: 'public',
                    theme: 'light'
                };
            }
            return result.rows[0];
        });
    }
    // 8. Update User Settings (Upsert)
    updateUserSettings(userId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email_notifications = true, push_notifications = true, profile_visibility = 'public', theme = 'light' } = settings;
            const result = yield db_1.default.query(`INSERT INTO sm.user_settings (user_id, email_notifications, push_notifications, profile_visibility, theme)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id) DO UPDATE SET
                email_notifications = EXCLUDED.email_notifications,
                push_notifications = EXCLUDED.push_notifications,
                profile_visibility = EXCLUDED.profile_visibility,
                theme = EXCLUDED.theme
             RETURNING email_notifications, push_notifications, profile_visibility, theme`, [userId, email_notifications, push_notifications, profile_visibility, theme]);
            return result.rows[0];
        });
    }
}
exports.UserRepository = UserRepository;
