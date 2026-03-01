import pool from "../config/db";

export class UserRepository {
  // 1. Get Current User Profile
  async getUserById(userId: string) {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, u.created_at, r.name as role_name
             FROM sm.users u
             LEFT JOIN sm.roles r ON u.role_id = r.id
             WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  // 2. Update Profile
  async updateUser(userId: string, fullName?: string, avatarUrl?: string) {
    let updateQuery = 'UPDATE sm.users SET ';
    const values: any[] = [];
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

    if (values.length === 0) return this.getUserById(userId);

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);

    updateQuery += ` WHERE id = $${i} RETURNING id, full_name, email, avatar_url`;
    values.push(userId);

    const result = await pool.query(updateQuery, values);
    return result.rows[0];
  }

  // 3. List Users (Admin)
  async listUsers() {
    // Leaving pagination extremely simple for now. 
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, u.created_at, r.name as role_name
             FROM sm.users u
             LEFT JOIN sm.roles r ON u.role_id = r.id
             ORDER BY u.created_at DESC`
    );
    return result.rows;
  }

  // 4. Assign Roles (Admin)
  async assignRole(userId: string, roleName: string) {
    // Find role id first
    const roleResult = await pool.query(`SELECT id FROM sm.roles WHERE name = $1`, [roleName]);
    if (roleResult.rowCount === 0) throw new Error("Role not found");

    const roleId = roleResult.rows[0].id;

    const result = await pool.query(
      `UPDATE sm.users SET role_id = $1 WHERE id = $2 RETURNING id, full_name, email`,
      [roleId, userId]
    );
    return result.rows[0];
  }

  // 5. Activity Feed
  async getUserActivity(userId: string) {
    const result = await pool.query(
      `SELECT id, action_type, description, created_at 
             FROM sm.user_activities 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  // 6. Notification History
  async getUserNotifications(userId: string) {
    const result = await pool.query(
      `SELECT id, title, body as message, is_read, created_at 
             FROM sm.notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  // 7. Get user settings
  async getUserSettings(userId: string) {
    let result = await pool.query(
      `SELECT email_notifications, push_notifications, profile_visibility, theme 
             FROM sm.user_settings 
             WHERE user_id = $1`,
      [userId]
    );

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
  }

  // 8. Update User Settings (Upsert)
  async updateUserSettings(userId: string, settings: any) {
    const { email_notifications = true, push_notifications = true, profile_visibility = 'public', theme = 'light' } = settings;

    const result = await pool.query(
      `INSERT INTO sm.user_settings (user_id, email_notifications, push_notifications, profile_visibility, theme)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id) DO UPDATE SET
                email_notifications = EXCLUDED.email_notifications,
                push_notifications = EXCLUDED.push_notifications,
                profile_visibility = EXCLUDED.profile_visibility,
                theme = EXCLUDED.theme
             RETURNING email_notifications, push_notifications, profile_visibility, theme`,
      [userId, email_notifications, push_notifications, profile_visibility, theme]
    );
    return result.rows[0];
  }
}
