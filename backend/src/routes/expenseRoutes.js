import { Router } from 'express'
import { createExpense, getExpenses, getGroupExpenses, deleteExpense } from '../controllers/expenseController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()

router.post('/', authenticate, asyncHandler(createExpense))
router.get('/', authenticate, asyncHandler(getExpenses))
router.get('/group/:groupId', authenticate, asyncHandler(getGroupExpenses))
router.delete('/:id', authenticate, asyncHandler(deleteExpense))

export default router
