import { getHomeDashboardData, getManagedUsers } from "@/lib/data"
import { requireAdmin } from "@/lib/auth"
import { AdminUsersClient } from "./admin-users-client"

export default async function AdminUsersPage() {
  const admin = await requireAdmin()
  const dashboard = await getHomeDashboardData(admin.id)
  const users = await getManagedUsers()

  return (
    <AdminUsersClient
      user={dashboard.user}
      alerts={dashboard.alerts}
      users={users}
      currentUserId={admin.id}
    />
  )
}
