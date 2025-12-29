/**
 * Dashboard Page
 * Main admin dashboard with statistics and charts
 */

import { useQuery } from '@tanstack/react-query'
import { Users, Layers, HelpCircle, TrendingUp } from 'lucide-react'
import { getDashboardStats } from '@/api/dashboard'
import { QUERY_KEYS } from '@/lib/constants'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { QuestionPerformanceChart } from '@/components/dashboard/QuestionPerformanceChart'
import { TopUsersTable } from '@/components/dashboard/TopUsersTable'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatNumber } from '@/lib/utils'

export const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.STATS,
    queryFn: getDashboardStats,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard statistics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your application statistics
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={formatNumber(stats.users.total)}
          icon={Users}
          description={`${stats.users.active} active users`}
          className="border-l-primary"
        />
        <StatsCard
          title="Total Levels"
          value={stats.levels.total}
          icon={Layers}
          description={`${stats.levels.published} published`}
          className="border-l-blue-500"
        />
        <StatsCard
          title="Total Questions"
          value={formatNumber(stats.questions.total)}
          icon={HelpCircle}
          description={`${stats.questions.active} active`}
          className="border-l-green-500"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.questionPerformance.successRate}%`}
          icon={TrendingUp}
          description={`${formatNumber(stats.questionPerformance.totalAttempts)} attempts`}
          className="border-l-yellow-500"
        />
      </div>

      {/* Charts and tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuestionPerformanceChart data={stats.questionPerformance} />
        <TopUsersTable users={stats.topUsers} />
      </div>
    </div>
  )
}