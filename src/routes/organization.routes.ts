import { Router } from "express";
import { getAllOrganizations, getOrganizationById, createOrganization, updateOrganization, deleteOrganization } from "../controllers/organization.controller";
import { verifyAuth, requireRole } from "../middlewares/auth.middleware";


const router = Router();

// for get all 
router.get("/all", getAllOrganizations);

// for get by id
router.get("/:id", getOrganizationById);


// for create
router.post("/create", verifyAuth, createOrganization);

// for update only one he created
router.put("/:id", verifyAuth, updateOrganization);

// for delete only one he created
router.delete("/:id", verifyAuth, deleteOrganization);

export default router;