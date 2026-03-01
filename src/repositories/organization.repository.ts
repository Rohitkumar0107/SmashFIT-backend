import pool from "../config/db";

export class OrganizationRepository {

    // ----------------------------------------------------
    // BASE ORGANIZATION CRUD
    // ----------------------------------------------------

    async findAll() {
        const query = `
        SELECT id, name, slug, logo_url, address, location, court_count, flooring_type, amenities, status, created_at 
        FROM sm.organizations ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    async findById(id: string) {
        const query = `SELECT * FROM sm.organizations WHERE id = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    async create(data: any) {
        const query = `
        INSERT INTO sm.organizations (
            owner_id, name, slug, address, location, court_count, flooring_type, 
            amenities, gst_number, business_email, description, logo_url, banner_url
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *;
        `;
        const values = [
            data.ownerId, data.name, data.slug, data.address, data.location, data.court_count,
            data.flooring_type, data.amenitiesJson, data.gst_number, data.business_email,
            data.description, data.logo_url, data.banner_url
        ];

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(query, values);
            const newOrg = result.rows[0];

            // Add owner as a member by default
            await client.query(`
                INSERT INTO sm.organization_members (organization_id, user_id, role)
                VALUES ($1, $2, 'OWNER')
            `, [newOrg.id, data.ownerId]);

            await client.query('COMMIT');
            return newOrg;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async update(id: string, ownerId: string, data: any) {
        // Enforce that only the owner can update the organization profile for now
        const query = `
        UPDATE sm.organizations 
        SET 
            name = COALESCE($1, name), slug = COALESCE($2, slug), address = COALESCE($3, address),
            location = COALESCE($4, location), court_count = COALESCE($5, court_count), flooring_type = COALESCE($6, flooring_type),
            amenities = COALESCE($7, amenities), gst_number = COALESCE($8, gst_number), business_email = COALESCE($9, business_email),
            description = COALESCE($10, description), logo_url = COALESCE($11, logo_url), banner_url = COALESCE($12, banner_url),
            updated_at = NOW()
        WHERE id = $13 AND owner_id = $14
        RETURNING *;
        `;
        const values = [
            data.name, data.slug, data.address, data.location, data.court_count, data.flooring_type,
            data.amenitiesJson, data.gst_number, data.business_email, data.description, data.logo_url, data.banner_url,
            id, ownerId
        ];
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    async delete(id: string, ownerId: string) {
        const query = `DELETE FROM sm.organizations WHERE id = $1 AND owner_id = $2 RETURNING id;`;
        const result = await pool.query(query, [id, ownerId]);
        return result.rows[0] || null;
    }

    // ----------------------------------------------------
    // TENANCY / MEMBERSHIP OPERATIONS
    // ----------------------------------------------------

    async getMembers(organizationId: string) {
        const query = `
            SELECT m.id as membership_id, m.role, m.joined_at, u.id as user_id, u.full_name, u.email, u.avatar_url
            FROM sm.organization_members m
            JOIN sm.users u ON m.user_id = u.id
            WHERE m.organization_id = $1
            ORDER BY m.joined_at DESC;
        `;
        const result = await pool.query(query, [organizationId]);
        return result.rows;
    }

    async verifyMembership(organizationId: string, userId: string, allowedRoles?: string[]) {
        const query = `SELECT role FROM sm.organization_members WHERE organization_id = $1 AND user_id = $2`;
        const result = await pool.query(query, [organizationId, userId]);
        if (result.rowCount === 0) return false;

        const role = result.rows[0].role;
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
            return false;
        }
        return true;
    }

    async createInvite(organizationId: string, email: string, role: string, inviterId: string) {
        // Set expiry to 7 days from now
        const query = `
            INSERT INTO sm.organization_invites (organization_id, email, role, invited_by, expires_at)
            VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
            RETURNING id, organization_id, email, role, status, expires_at;
        `;
        const result = await pool.query(query, [organizationId, email, role, inviterId]);
        return result.rows[0];
    }

    async getInviteById(inviteId: string) {
        const query = `SELECT * FROM sm.organization_invites WHERE id = $1`;
        try {
            const result = await pool.query(query, [inviteId]);
            return result.rows[0] || null;
        } catch {
            return null; // UUID parse error fallback
        }
    }

    async acceptInvite(inviteId: string, userId: string, organizationId: string, role: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Mark invite as accepted
            await client.query(`UPDATE sm.organization_invites SET status = 'ACCEPTED' WHERE id = $1`, [inviteId]);

            // Add member
            const memberResult = await client.query(`
                INSERT INTO sm.organization_members (organization_id, user_id, role)
                VALUES ($1, $2, $3)
                ON CONFLICT (organization_id, user_id) DO NOTHING
                RETURNING *;
            `, [organizationId, userId, role]);

            await client.query('COMMIT');
            return memberResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async updateMemberRole(organizationId: string, targetUserId: string, newRole: string) {
        const query = `
            UPDATE sm.organization_members 
            SET role = $1 
            WHERE organization_id = $2 AND user_id = $3 
            RETURNING *;
        `;
        const result = await pool.query(query, [newRole, organizationId, targetUserId]);
        return result.rows[0] || null;
    }

    // ----------------------------------------------------
    // VOUCHERS
    // ----------------------------------------------------

    async createVoucher(organizationId: string, code: string, discountPercentage: number | null, discountFixed: number | null, maxUses: number) {
        const query = `
            INSERT INTO sm.organization_vouchers (organization_id, code, discount_percentage, discount_fixed, max_uses, expires_at)
            VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
            RETURNING *;
        `;
        const result = await pool.query(query, [organizationId, code, discountPercentage, discountFixed, maxUses]);
        return result.rows[0];
    }
}