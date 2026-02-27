import pool from "../config/db";

export class OrganizationRepository {
  
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
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async update(id: string, ownerId: string, data: any) {
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
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    async delete(id: string, ownerId: string) {
        const query = `DELETE FROM sm.organizations WHERE id = $1 AND owner_id = $2 RETURNING id;`;
        const result = await pool.query(query, [id, ownerId]);
        return result.rows[0] || null;
    }
}