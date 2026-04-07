import { Expense } from '../models/Expense.js'
import { Group } from '../models/Group.js'
import { User } from '../models/User.js'
import mongoose from 'mongoose'

export async function getMyDashboard(req, res) {
  const userId = new mongoose.Types.ObjectId(req.userId)

  // 1. Total paid by me
  const paidByMe = await Expense.aggregate([
    { $match: { paidBy: userId } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ])

  // 2. Total I owe (sum of my shares in splitBetween)
  const myTotalShare = await Expense.aggregate([
    { $unwind: "$splitBetween" },
    { $match: { "splitBetween.user": userId } },
    { $group: { _id: null, total: { $sum: "$splitBetween.share" } } }
  ])

  const totalPaid = paidByMe[0]?.total || 0
  const totalShare = myTotalShare[0]?.total || 0

  res.status(200).json({
    success: true,
    data: {
      totalPaid,
      totalShare,
      netBalance: totalPaid - totalShare,
    }
  })
}

export async function getGroupSettlement(req, res) {
  const { groupId } = req.params
  
  const group = await Group.findById(groupId).populate('members', 'name email')
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' })

  const expenses = await Expense.find({ groupId })

  // Calculate net balances for each member in this group context
  // balance = total_paid - total_share
  const balances = {}
  group.members.forEach(member => {
    balances[member._id.toString()] = 0
  })

  expenses.forEach(expense => {
    const payerId = expense.paidBy.toString()
    balances[payerId] += expense.amount

    expense.splitBetween.forEach(split => {
      const userId = split.user.toString()
      balances[userId] -= split.share
    })
  })

  // Convert balances to list of settlements
  // positive balance means you should receive. negative means you owe.
  const members = group.members.map(m => ({
    id: m._id.toString(),
    name: m.name || m.email,
    balance: Math.round(balances[m._id.toString()] * 100) / 100
  }))

  res.status(200).json({
    success: true,
    data: {
      members,
      summary: members.filter(m => m.balance !== 0)
    }
  })
}

export async function getGroupDashboard(req, res) {
    const { groupId } = req.params
    const gid = new mongoose.Types.ObjectId(groupId)

    // Total group expenses
    const totalGroupExpense = await Expense.aggregate([
        { $match: { groupId: gid } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ])

    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
        { $match: { groupId: gid } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ])

    // Per user contribution
    const perUserContribution = await Expense.aggregate([
        { $match: { groupId: gid } },
        { $group: { _id: "$paidBy", total: { $sum: "$amount" } } }
    ])

    res.status(200).json({
        success: true,
        data: {
            total: totalGroupExpense[0]?.total || 0,
            categories: categoryBreakdown,
            contributions: perUserContribution
        }
    })
}
