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
exports.OrganizationRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class OrganizationRepository {
    // ----------------------------------------------------
    // BASE ORGANIZATION CRUD
    // ----------------------------------------------------
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
        SELECT id, name, slug, logo_url, address, location, court_count, flooring_type, amenities, status, created_at 
        FROM sm.organizations ORDER BY created_at DESC
        `;
            const result = yield db_1.default.query(query);
            return result.rows;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `SELECT * FROM sm.organizations WHERE id = $1`;
            const result = yield db_1.default.query(query, [id]);
            return result.rows[0] || null;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                const result = yield client.query(query, values);
                const newOrg = result.rows[0];
                // Add owner as a member by default
                yield client.query(`
                INSERT INTO sm.organization_members (organization_id, user_id, role)
                VALUES ($1, $2, 'OWNER')
            `, [newOrg.id, data.ownerId]);
                yield client.query('COMMIT');
                return newOrg;
            }
            catch (error) {
                yield client.query('ROLLBACK');
                throw error;
            }
            finally {
                client.release();
            }
        });
    }
    update(id, ownerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const result = yield db_1.default.query(query, values);
            return result.rows[0] || null;
        });
    }
    delete(id, ownerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `DELETE FROM sm.organizations WHERE id = $1 AND owner_id = $2 RETURNING id;`;
            const result = yield db_1.default.query(query, [id, ownerId]);
            return result.rows[0] || null;
        });
    }
    // ----------------------------------------------------
    // TENANCY / MEMBERSHIP OPERATIONS
    // ----------------------------------------------------
    getMembers(organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            SELECT m.id as membership_id, m.role, m.joined_at, u.id as user_id, u.full_name, u.email, u.avatar_url
            FROM sm.organization_members m
            JOIN sm.users u ON m.user_id = u.id
            WHERE m.organization_id = $1
            ORDER BY m.joined_at DESC;
        `;
            const result = yield db_1.default.query(query, [organizationId]);
            return result.rows;
        });
    }
    verifyMembership(organizationId, userId, allowedRoles) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `SELECT role FROM sm.organization_members WHERE organization_id = $1 AND user_id = $2`;
            const result = yield db_1.default.query(query, [organizationId, userId]);
            if (result.rowCount === 0)
                return false;
            const role = result.rows[0].role;
            if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
                return false;
            }
            return true;
        });
    }
    createInvite(organizationId, email, role, inviterId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set expiry to 7 days from now
            const query = `
            INSERT INTO sm.organization_invites (organization_id, email, role, invited_by, expires_at)
            VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
            RETURNING id, organization_id, email, role, status, expires_at;
        `;
            const result = yield db_1.default.query(query, [organizationId, email, role, inviterId]);
            return result.rows[0];
        });
    }
    getInviteById(inviteId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `SELECT * FROM sm.organization_invites WHERE id = $1`;
            try {
                const result = yield db_1.default.query(query, [inviteId]);
                return result.rows[0] || null;
            }
            catch (_a) {
                return null; // UUID parse error fallback
            }
        });
    }
    acceptInvite(inviteId, userId, organizationId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                // Mark invite as accepted
                yield client.query(`UPDATE sm.organization_invites SET status = 'ACCEPTED' WHERE id = $1`, [inviteId]);
                // Add member
                const memberResult = yield client.query(`
                INSERT INTO sm.organization_members (organization_id, user_id, role)
                VALUES ($1, $2, $3)
                ON CONFLICT (organization_id, user_id) DO NOTHING
                RETURNING *;
            `, [organizationId, userId, role]);
                yield client.query('COMMIT');
                return memberResult.rows[0];
            }
            catch (error) {
                yield client.query('ROLLBACK');
                throw error;
            }
            finally {
                client.release();
            }
        });
    }
    updateMemberRole(organizationId, targetUserId, newRole) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            UPDATE sm.organization_members 
            SET role = $1 
            WHERE organization_id = $2 AND user_id = $3 
            RETURNING *;
        `;
            const result = yield db_1.default.query(query, [newRole, organizationId, targetUserId]);
            return result.rows[0] || null;
        });
    }
    // ----------------------------------------------------
    // VOUCHERS
    // ----------------------------------------------------
    createVoucher(organizationId, code, discountPercentage, discountFixed, maxUses) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            INSERT INTO sm.organization_vouchers (organization_id, code, discount_percentage, discount_fixed, max_uses, expires_at)
            VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
            RETURNING *;
        `;
            const result = yield db_1.default.query(query, [organizationId, code, discountPercentage, discountFixed, maxUses]);
            return result.rows[0];
        });
    }
}
exports.OrganizationRepository = OrganizationRepository;
