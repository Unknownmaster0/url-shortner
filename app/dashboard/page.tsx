import { auth } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()

  return (
    <h1>Dashboard</h1>
  )
}
