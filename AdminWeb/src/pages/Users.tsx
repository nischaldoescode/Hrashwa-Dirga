/**
 * Users Page
 * View and manage user accounts
 */

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useUsers, useToggleUserStatus, useDeleteUser } from '@/hooks/useUsers'
import { formatDate, formatNumber, getInitials, debounce } from '@/lib/utils'
import type { User } from '@/types'

export const Users = () => {
  const [page] = useState(1)
  const [search, setSearch] = useState('')
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  
  const { data, isLoading } = useUsers(page, 20, search)
  const toggleStatusMutation = useToggleUserStatus()
  const deleteMutation = useDeleteUser()

  /**
   * Debounced search handler
   */
  const handleSearch = debounce((value: string) => {
    setSearch(value)
  }, 500)

  /**
   * Handle user deletion
   */
  const handleDelete = () => {
    if (deletingUserId) {
      deleteMutation.mutate(deletingUserId, {
        onSuccess: () => setDeletingUserId(null),
      })
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />
  }

  const users = data?.users || []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            View and manage user accounts
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-24">Level</TableHead>
              <TableHead className="w-24">Coins</TableHead>
              <TableHead className="w-32">Score</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-48">Joined</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.currentLevel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.coins}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatNumber(user.totalScore)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate(user._id)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUserId(user._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={!!deletingUserId}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        description="This will permanently delete this user account and all associated data. This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}