/**
 * users page
 * view and manage user accounts with username and country info
 */

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { useUsers, useToggleUserStatus, useDeleteUser } from "@/hooks/useUsers";
import { formatDate, formatNumber, getInitials, debounce } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { User } from "@/types";

import { CountryFlag } from "@/components/ui/CountryFlag";

export const Users = () => {
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const { data, isLoading } = useUsers(page, 20, search);
  const toggleStatusMutation = useToggleUserStatus();
  const deleteMutation = useDeleteUser();

  /**
   * debounced search handler
   */
  const handleSearch = debounce((value: string) => {
    setSearch(value);
  }, 500);

  /**
   * handle user deletion
   */
  const handleDelete = () => {
    if (deletingUserId) {
      deleteMutation.mutate(deletingUserId, {
        onSuccess: () => setDeletingUserId(null),
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  const users = data?.users || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Users
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage user accounts
          </p>
        </div>
      </div>

      {/* search bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* users table - desktop view */}
      <div className="hidden lg:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="w-20">Level</TableHead>
              <TableHead className="w-20">Coins</TableHead>
              <TableHead className="w-28">Score</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-40">Joined</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                >
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
                  <TableCell>
                    {user.username ? (
                      <Badge variant="secondary" className="font-mono text-xs">
                        {user.username}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <CountryFlag
                      countryCode={user.country}
                      size="md"
                      showCode={true}
                    />
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
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
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
                        {user.isActive ? "Deactivate" : "Activate"}
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

      {/* users cards - mobile/tablet view */}
      <div className="lg:hidden space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          users.map((user: User) => (
            <Card key={user._id} className="p-4">
              <div className="space-y-3">
                {/* user header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback>
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      {user.username && (
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs mt-1"
                        >
                          {user.username}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* user details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="truncate max-w-[200px]">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Country:</span>
                    <CountryFlag
                      countryCode={user.country}
                      size="sm"
                      showCode={true}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <Badge variant="outline">{user.currentLevel}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coins:</span>
                    <Badge variant="secondary">{user.coins}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-medium">
                      {formatNumber(user.totalScore)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                {/* actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleStatusMutation.mutate(user._id)}
                    disabled={toggleStatusMutation.isPending}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeletingUserId(user._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* delete confirmation dialog */}
      <DeleteDialog
        open={!!deletingUserId}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        description="This will permanently delete this user account and all associated data. This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
