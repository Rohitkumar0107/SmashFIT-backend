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
exports.OrganizationService = void 0;
const organization_repository_1 = require("../repositories/organization.repository");
// Helper function
const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};
class OrganizationService {
    getAllOrganizations() {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new organization_repository_1.OrganizationRepository();
            return yield repository.findAll();
        });
    }
    getOrganizationById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new organization_repository_1.OrganizationRepository();
            return yield repository.findById(id);
        });
    }
    createOrganization(ownerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.name) {
                throw new Error("Organization name is required");
            }
            const slug = generateSlug(data.name);
            const amenitiesJson = data.amenities
                ? JSON.stringify(data.amenities)
                : JSON.stringify({ parking: false, shower: false, ac: false, water: true });
            const payload = Object.assign(Object.assign({}, data), { ownerId, slug, amenitiesJson });
            const repository = new organization_repository_1.OrganizationRepository();
            return yield repository.create(payload);
        });
    }
    updateOrganization(id, ownerId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const slug = data.name ? generateSlug(data.name) : null;
            const amenitiesJson = data.amenities ? JSON.stringify(data.amenities) : null;
            const payload = Object.assign(Object.assign({}, data), { slug, amenitiesJson });
            const repository = new organization_repository_1.OrganizationRepository();
            return yield repository.update(id, ownerId, payload);
        });
    }
    deleteOrganization(id, ownerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new organization_repository_1.OrganizationRepository();
            return yield repository.delete(id, ownerId);
        });
    }
}
exports.OrganizationService = OrganizationService;
