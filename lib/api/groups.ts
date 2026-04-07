import { apiFetch } from "./client"

export interface Group {
  id: string
  name: string
  members: Array<{ id: string; name: string; email: string }>
  createdBy: string
}

export async function fetchGroups(): Promise<Group[]> {
  const res = await apiFetch("/groups")
  const json = await res.json()
  if (!json.success) throw new Error(json.message || "Failed to fetch groups")
  return json.data
}

export async function createGroup(data: { name: string; memberEmails: string[] }): Promise<Group> {
  const res = await apiFetch("/groups", {
    method: "POST",
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || "Failed to create group")
  return json.data
}

export interface Settlement {
  members: Array<{ id: string; name: string; balance: number }>
  summary: Array<{ id: string; name: string; balance: number }>
}

export async function fetchGroupSettlement(groupId: string): Promise<Settlement> {
  const res = await apiFetch(`/dashboard/group/${groupId}/settlement`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message || "Failed to fetch settlement")
  return json.data
}

export async function deleteGroup(groupId: string): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}`, {
    method: "DELETE",
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || "Failed to delete group")
}
