import { UserRepository } from "../repositories/user.repository";

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async getCurrentUser(userId: string) {
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async getUserById(userId: string) {
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async updateUser(userId: string, targetUserId: string, fullName?: string, avatarUrl?: string) {
        // Business logic: Users can only update their own profile unless they are admins.
        // For now, ensuring strict self-update.
        if (userId !== targetUserId) {
            throw new Error("Unauthorized to update other user profiles");
        }
        return await this.userRepository.updateUser(targetUserId, fullName, avatarUrl);
    }

    async listUsers() {
        // In a real app we'd add paging inputs, sorting, filters here
        return await this.userRepository.listUsers();
    }

    async assignRole(targetUserId: string, roleName: string) {
        // Business logic wrapper for granting roles (ensuring correct strings, emitting events, etc)
        const validRoles = ["Admin", "Player", "Coach", "Venue Owner"]; // Example mapping
        if (!validRoles.includes(roleName)) {
            throw new Error("Invalid role name assignment");
        }
        return await this.userRepository.assignRole(targetUserId, roleName);
    }

    async getUserActivity(userId: string) {
        return await this.userRepository.getUserActivity(userId);
    }

    async getUserNotifications(userId: string) {
        return await this.userRepository.getUserNotifications(userId);
    }

    async getUserSettings(userId: string) {
        return await this.userRepository.getUserSettings(userId);
    }

    async updateUserSettings(userId: string, targetUserId: string, settings: any) {
        if (userId !== targetUserId) {
            throw new Error("Unauthorized to update other user settings");
        }

        // Validate settings object
        const allowedThemes = ['light', 'dark', 'system'];
        const allowedVisibility = ['public', 'private', 'friends'];

        const sanitizedSettings: any = {};
        if (settings.email_notifications !== undefined) sanitizedSettings.email_notifications = !!settings.email_notifications;
        if (settings.push_notifications !== undefined) sanitizedSettings.push_notifications = !!settings.push_notifications;
        if (settings.profile_visibility && allowedVisibility.includes(settings.profile_visibility)) {
            sanitizedSettings.profile_visibility = settings.profile_visibility;
        }
        if (settings.theme && allowedThemes.includes(settings.theme)) {
            sanitizedSettings.theme = settings.theme;
        }

        return await this.userRepository.updateUserSettings(targetUserId, sanitizedSettings);
    }
}