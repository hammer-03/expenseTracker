import { Router } from 'express'
import { getMyDashboard, getGroupDashboard, getGroupSettlement } from '../controllers/dashboardController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()

router.get('/me', authenticate, asyncHandler(getMyDashboard))
router.get('/group/:groupId', authenticate, asyncHandler(getGroupDashboard))
router.get('/group/:groupId/settlement', authenticate, asyncHandler(getGroupSettlement))

export default router
