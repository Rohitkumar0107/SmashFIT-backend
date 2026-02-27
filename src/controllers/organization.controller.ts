import { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service";
import { OrganizationRequest } from "../models/organization.model";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

export const getAllOrganizations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const organizationService = new OrganizationService();  
        const orgs = await organizationService.getAllOrganizations();
        res.status(200).json({ success: true, data: orgs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getOrganizationById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const organizationService = new OrganizationService();  
        const org = await organizationService.getOrganizationById(id);
        if (!org) return res.status(404).json({ success: false, message: "Organization not found" });
        
        res.status(200).json({ success: true, data: org });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const createOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const request: OrganizationRequest = req.body;
        const ownerId = req.user.id; 
        const organizationService = new OrganizationService();  
        const newOrg = await organizationService.createOrganization(ownerId, request);
        
        res.status(201).json({ success: true, message: "Organization created", data: newOrg });
    } catch (error: any) {
        if (error.code === '23505') {
        return res.status(400).json({ success: false, message: "An organization with this name already exists" });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const ownerId = req.user.id;
        const organizationService = new OrganizationService();  
        const updatedOrg = await organizationService.updateOrganization(id, ownerId, req.body);
        
        if (!updatedOrg) return res.status(403).json({ success: false, message: "Not authorized or not found" });
        res.status(200).json({ success: true, message: "Organization updated", data: updatedOrg });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const ownerId = req.user.id;
        const organizationService = new OrganizationService();  
        const deletedOrg = await organizationService.deleteOrganization(id, ownerId);
        
        if (!deletedOrg) return res.status(403).json({ success: false, message: "Not authorized to delete" });
        res.status(200).json({ success: true, message: "Organization deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};