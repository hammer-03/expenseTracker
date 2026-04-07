import { Router } from 'express'
import { createGroup, getGroups, addMember, deleteGroup } from '../controllers/groupController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()

router.post('/', authenticate, asyncHandler(createGroup))
router.get('/', authenticate, asyncHandler(getGroups))
router.post('/:groupId/members', authenticate, asyncHandler(addMember))
router.delete('/:groupId', authenticate, asyncHandler(deleteGroup))

export default router
