/**
 * Top Users Table Component
 * Displays top performing users
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'

interface TopUser {
  _id: string
  displayName: string
  email: string
  totalScore: number
}

interface TopUsersTableProps {
  users: TopUser[]
}

export const TopUsersTable = ({ users }: TopUsersTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Players</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Badge
                      variant={index === 0 ? 'default' : 'secondary'}
                      className="w-8 justify-center"
                    >
                      {index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatNumber(user.totalScore)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}