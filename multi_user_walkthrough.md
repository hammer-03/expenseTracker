# Multi-User Shared Expense System Walkthrough

I have converted your single-user expense tracker into a multi-user, group-based shared expense system. The backend now supports groups, memberships, equal splitting of expenses, and balance settlements.

## 🛠️ Backend Architecture

### 1. Database Schema
- **User**: Name, email, and password hashing for secure authentication.
- **Group**: Scoped collection of members (users) who share expenses.
- **Expense**: 
  - `groupId`: Links the expense to a specific group.
  - `paidBy`: The user who fronted the money.
  - `splitBetween`: An array tracking the calculated share for every member.
  - `amount`, `category`, `description`, `date`.

### 2. Core Logic
- **Equal Split**: When an expense is added to a group, the backend automatically divides the total amount by the number of group members. It stores this "share" for each member in the `splitBetween` array.
- **Settlement Engine**: 
  - `Balance = (Total Paid by User) - (User's Total Share)`.
  - A positive balance means others owe you; a negative balance means you owe others.

---

## 📡 API Reference

### Auth
- `POST /auth/signup`: Create a new account.
- `POST /auth/login`: Get a JWT token.
- `GET /auth/me`: Get current user details.

### Groups
- `POST /groups`: Create a new group. (e.g., `{ "name": "Roommates", "memberEmails": ["friend1@email.com"] }`)
- `GET /groups`: List all groups you belong to.
- `POST /groups/:groupId/members`: Add a user to a group via email.

### Expenses
- `POST /expenses`: Add an expense to a group. (Calculates split automatically)
- `GET /expenses/group/:groupId`: View all expenses for a specific group.
- `DELETE /expenses/:id`: Delete an expense.

### Dashboard & Analytics
- `GET /dashboard/me`: Your overall spending and net balance.
- `GET /dashboard/group/:groupId`: Total group spending, category stats, and per-user contributions.
- `GET /dashboard/group/:groupId/settlement`: **The "Splitwise" view.** Shows exactly who owes what to whom.

---

## 💻 Frontend Integration Guide

To connect your existing Next.js frontend, follow these steps:

### 1. Update Auth State
Your `lib/auth-context.tsx` is already set up to handle JWT. No major changes needed here, just ensure your login/signup calls the new `/auth` endpoints.

### 2. Group Management
- Create a **Group Selector** (dropdown or sidebar) so users can switch between their personal dashboard and different groups.
- Store the `activeGroupId` in your state or URL (e.g., `/groups/[id]`).

### 3. Adding Shared Expenses
Modify your `AddExpenseModal`:
- **Current**: Only asks for `description`, `amount`, `category`.
- **New**: Must include a `groupId` field. Use the current `activeGroupId` by default.
- **Logic**: When submitting, send the `groupId`. The backend will find the members and calculate the 50/50 split (or whatever N-way split) automatically.

### 4. The Settlement UI
Create a new view (`GroupDashboard`) that fetches from `/dashboard/group/:groupId/settlement`.
- Display a list of members with their balances:
  - `User A: +₹2,000` (Should receive)
  - `User B: -₹2,000` (Owes money)
- Implement a "Settle Up" button that could (conceptually) create a "Payment" expense to zero out a balance.

### 5. API Client
Ensure your `lib/api/client.ts` is hitting the correct `BASE_URL` (likely `http://localhost:5000` via `.env.local`).

---

## 🚀 Next Steps
1. **Restart your backend**: `npm run dev` in the `/backend` folder.
2. **Sync Frontend**: Update your API calls to use the new group-scoped endpoints.
3. **Seed Data**: Register two users, have one create a group and add the other, then add an expense to see the settlement logic in action!
