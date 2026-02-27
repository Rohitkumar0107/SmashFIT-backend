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
            // 👇 Yahan 'city' ko 'location' kar diya hai
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
            const result = yield db_1.default.query(query, values);
            return result.rows[0];
        });
    }
    update(id, ownerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 👇 Yahan bhi 'city' ko 'location' kar diya hai
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
}
exports.OrganizationRepository = OrganizationRepository;
