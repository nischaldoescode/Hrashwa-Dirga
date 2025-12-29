/**
 * Leaderboard Page
 * View global player rankings
 */

import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { QUERY_KEYS } from '@/lib/constants'
import { formatNumber, getInitials } from '@/lib/utils'
import axiosInstance from '@/api/axios'
import type { LeaderboardEntry } from '@/types'

/**
 * Fetch leaderboard data from admin endpoint
 * Uses admin authentication (adminToken cookie)
 * 
 * @returns Array of leaderboard entries with rank
 * @throws Error if request fails or user not authenticated
 */
const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const response = await axiosInstance.get('/leaderboard/admin?limit=100')
  return response.data.data!.leaderboard
}

export const Leaderboard = () => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: QUERY_KEYS.LEADERBOARD.ALL,
    queryFn: getLeaderboard,
    staleTime: 1 * 60 * 1000,
  })

  if (isLoading) {
    return <LoadingSpinner message="Loading leaderboard..." />
  }

  /**
   * Get badge variant based on rank
   */
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return { variant: 'default' as const, emoji: '🥇' }
      case 2:
        return { variant: 'secondary' as const, emoji: '🥈' }
      case 3:
        return { variant: 'outline' as const, emoji: '🥉' }
      default:
        return { variant: 'outline' as const, emoji: null }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">
          Global rankings of all players by total score
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(leaderboard?.length || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard && leaderboard.length > 0
                ? formatNumber(leaderboard[0].totalScore)
                : '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard && leaderboard.length > 0
                ? formatNumber(
                    Math.round(
                      leaderboard.reduce((sum, entry) => sum + entry.totalScore, 0) /
                        leaderboard.length
                    )
                  )
                : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard table */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!leaderboard || leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No leaderboard data available
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((entry) => {
                    const rankBadge = getRankBadge(entry.rank)
                    return (
                      <TableRow key={entry._id}>
                        <TableCell>
                          <Badge variant={rankBadge.variant} className="w-12 justify-center">
                            {rankBadge.emoji || entry.rank}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.photoURL || undefined} />
                              <AvatarFallback>
                                {getInitials(entry.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{entry.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.email}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatNumber(entry.totalScore)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}