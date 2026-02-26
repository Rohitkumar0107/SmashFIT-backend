import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

// Dashboard Public bhi ho sakta hai (Viewers ke liye) 
// Agar sirf logged-in users ko dikhana hai toh verifyAuth laga do
router.get('/summary', verifyAuth, getDashboardSummary);

export default router;