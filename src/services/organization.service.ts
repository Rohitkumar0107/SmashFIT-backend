import { OrganizationRepository } from "../repositories/organization.repository";

// Helper function
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export class OrganizationService {
  
    async getAllOrganizations() {
        const repository: OrganizationRepository = new OrganizationRepository();
        return await repository.findAll();
    }

    async getOrganizationById(id: string) {
        const repository: OrganizationRepository = new OrganizationRepository();
        return await repository.findById(id);
    }

    async createOrganization(ownerId: string, data: any) {
        if (!data.name) {
        throw new Error("Organization name is required");
        }

        const slug = generateSlug(data.name);
        const amenitiesJson = data.amenities 
        ? JSON.stringify(data.amenities) 
        : JSON.stringify({ parking: false, shower: false, ac: false, water: true });

        const payload = { ...data, ownerId, slug, amenitiesJson };
        
        const repository: OrganizationRepository = new OrganizationRepository();
        return await repository.create(payload);
    }

    async updateOrganization(id: string, ownerId: string, data: any) {
        const slug = data.name ? generateSlug(data.name) : null;
        const amenitiesJson = data.amenities ? JSON.stringify(data.amenities) : null;

        const payload = { ...data, slug, amenitiesJson };
        const repository: OrganizationRepository = new OrganizationRepository();
        return await repository.update(id, ownerId, payload);
    }

    async deleteOrganization(id: string, ownerId: string) {
        const repository: OrganizationRepository = new OrganizationRepository();
        return await repository.delete(id, ownerId);
    }
}