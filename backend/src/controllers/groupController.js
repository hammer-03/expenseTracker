import { Group } from '../models/Group.js'
import { Expense } from '../models/Expense.js'
import { User } from '../models/User.js'
import { AppError } from '../middleware/errorHandler.js'

export async function createGroup(req, res) {
  const { name, memberEmails } = req.body
  const createdBy = req.userId

  // Find all users by email
  const members = [createdBy]
  
  if (memberEmails && Array.isArray(memberEmails)) {
    for (const email of memberEmails) {
      if (!email || !email.includes('@')) continue;
      const user = await User.findOne({ email: email.toLowerCase().trim() })
      if (!user) {
        throw new AppError(`User with email ${email} not found. They must register first so you can share expenses with them.`, 400)
      }
      if (!members.map(m => m.toString()).includes(user._id.toString())) {
        members.push(user._id)
      }
    }
  }

  const group = await Group.create({
    name,
    members,
    createdBy
  })

  res.status(201).json({
    success: true,
    data: group
  })
}

export async function getGroups(req, res) {
  const groups = await Group.find({ members: req.userId })
    .populate('members', 'name email')
    .sort('-createdAt')

  res.status(200).json({
    success: true,
    data: groups
  })
}

export async function addMember(req, res) {
  const { groupId } = req.params
  const { email } = req.body

  const group = await Group.findById(groupId)
  if (!group) throw new AppError('Group not found', 404)
  
  // Check if current user is in group
  if (!group.members.includes(req.userId)) {
    throw new AppError('Not authorized to modify this group', 403)
  }

  const userToAdd = await User.findOne({ email: email.toLowerCase().trim() })
  if (!userToAdd) {
    throw new AppError(`User with email ${email} not found. They must register for an account first so you can add them to a group.`, 400)
  }

  if (group.members.includes(userToAdd._id)) {
    throw new AppError('User already in group', 400)
  }

  group.members.push(userToAdd._id)
  await group.save()

  res.status(200).json({
    success: true,
    data: group
  })
}

export async function deleteGroup(req, res) {
  const { groupId } = req.params
  const userId = req.userId

  const group = await Group.findById(groupId)
  if (!group) throw new AppError('Group not found', 404)

  if (group.createdBy.toString() !== userId.toString()) {
    throw new AppError('Only the creator can delete this group', 403)
  }

  // Optional: delete all expenses associated with this group
  await Expense.deleteMany({ groupId })

  await Group.findByIdAndDelete(groupId)

  res.status(200).json({
    success: true,
    message: 'Group deleted successfully'
  })
}
