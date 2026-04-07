import { Group } from '../models/Group.js'
import { Expense } from '../models/Expense.js'
import { AppError } from '../middleware/errorHandler.js'
import mongoose from 'mongoose'

export async function createExpense(req, res) {
  let { groupId, description, category, amount, date, notes } = req.body
  const paidBy = req.userId

  // Handle case where frontend isn't sending groupId yet (backward compatibility)
  if (!groupId) {
    // Find a group with only this user as a member and name Personal
    let personalGroup = await Group.findOne({ members: { $size: 1, $all: [paidBy] } })
    if (!personalGroup) {
      personalGroup = await Group.create({
        name: 'Personal',
        members: [paidBy],
        createdBy: paidBy
      })
    }
    groupId = personalGroup._id
  }

  const group = await Group.findById(groupId)
  if (!group) throw new AppError('Group not found', 404)

  if (!group.members.includes(paidBy)) {
    throw new AppError('User not part of this group', 403)
  }

  // Split equally
  const share = Number(amount) / group.members.length
  const splitBetween = group.members.map(memberId => ({
    user: memberId,
    share: share
  }))

  const expense = await Expense.create({
    groupId,
    paidBy,
    description,
    category,
    amount: Number(amount),
    date: date || new Date(),
    splitBetween,
    notes
  })

  res.status(201).json({
    success: true,
    data: expense
  })
}

export async function getGroupExpenses(req, res) {
  const { groupId } = req.params
  
  const group = await Group.findById(groupId)
  if (!group) throw new AppError('Group not found', 404)
  
  if (!group.members.includes(req.userId)) {
    throw new AppError('Not authorized', 403)
  }

  const expenses = await Expense.find({ groupId })
    .populate('paidBy', 'name email')
    .sort('-date')

  res.status(200).json({
    success: true,
    data: expenses
  })
}

export async function deleteExpense(req, res) {
  const { id } = req.params
  const expense = await Expense.findById(id)
  
  if (!expense) throw new AppError('Expense not found', 404)
  
  // Only the person who paid can delete for now, or group creator?
  if (expense.paidBy.toString() !== req.userId) {
    throw new AppError('Unauthorized', 403)
  }

  await Expense.findByIdAndDelete(id)

  res.status(200).json({
    success: true,
    message: 'Expense deleted'
  })
}

export async function getExpenses(req, res) {
  const userId = new mongoose.Types.ObjectId(req.userId)
  
  // Find all groups where user is a member
  const groupsUserIsIn = await Group.find({ members: userId }).select('_id')
  const groupIds = groupsUserIsIn.map(g => g._id)

  const expenses = await Expense.find({ groupId: { $in: groupIds } })
    .populate('paidBy', 'name email')
    .sort('-date')

  res.status(200).json({
    success: true,
    data: expenses
  })
}
