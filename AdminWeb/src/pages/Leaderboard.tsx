/**
 * leaderboard page
 * view global player rankings with country filtering
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Globe, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { QUERY_KEYS, COUNTRIES } from "@/lib/constants";
import { formatNumber, getInitials } from "@/lib/utils";
import axiosInstance from "@/api/axios";
import type { LeaderboardEntry } from "@/types";
import { CountryFlag } from "@/components/ui/CountryFlag";
/**
 * fetch leaderboard data with optional country filter
 * @param country - iso 3166-1 alpha-2 country code or null for global
 */
const getLeaderboard = async (
  country: string | null,
): Promise<LeaderboardEntry[]> => {
  const url = country
    ? `/leaderboard/admin?limit=100&country=${country}`
    : "/leaderboard/admin?limit=100";

  const response = await axiosInstance.get(url);
  return response.data.data!.leaderboard;
};

/**
 * get rank medal/badge configuration with animation class
 */
const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        variant: "default" as const,
        emoji: "🥇",
        animation: "animate-bounce-slow",
      };
    case 2:
      return {
        variant: "secondary" as const,
        emoji: "🥈",
        animation: "animate-pulse-slow",
      };
    case 3:
      return {
        variant: "outline" as const,
        emoji: "🥉",
        animation: "animate-wiggle",
      };
    default:
      return {
        variant: "outline" as const,
        emoji: null,
        animation: "",
      };
  }
};

export const Leaderboard = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const {
    data: leaderboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: [...QUERY_KEYS.LEADERBOARD.ALL, selectedCountry],
    queryFn: () => getLeaderboard(selectedCountry),
    staleTime: 1 * 60 * 1000,
    retry: 2,
  });

  /**
   * handle country filter change
   */
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value === "global" ? null : value);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Failed to load leaderboard</p>
        <p className="text-sm text-red-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* page header with country filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {selectedCountry
              ? `${COUNTRIES.find((c) => c.code === selectedCountry)?.name} rankings`
              : "Global rankings of all players by total score"}
          </p>
        </div>

        {/* country filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <Select
            value={selectedCountry || "global"}
            onValueChange={handleCountryChange}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Global</span>
                </div>
              </SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* statistics cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
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
            <div className="text-xl sm:text-2xl font-bold">
              {leaderboard && leaderboard.length > 0
                ? formatNumber(leaderboard[0].totalScore)
                : "0"}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {leaderboard && leaderboard.length > 0
                ? formatNumber(
                    Math.round(
                      leaderboard.reduce(
                        (sum, entry) => sum + entry.totalScore,
                        0,
                      ) / leaderboard.length,
                    ),
                  )
                : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* leaderboard table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 sm:w-20">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Country
                  </TableHead>
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
                    const rankBadge = getRankBadge(entry.rank);
                    return (
                      <TableRow
                        key={entry._id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <Badge
                            variant={rankBadge.variant}
                            className={`w-10 sm:w-12 justify-center ${rankBadge.animation}`}
                          >
                            {rankBadge.emoji || entry.rank}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                              <AvatarImage src={entry.photoURL || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(entry.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                              <span className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                                {entry.displayName}
                              </span>
                              <div className="sm:hidden">
                                <CountryFlag
                                  countryCode={entry.country}
                                  size="sm"
                                  showCode={true}
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <CountryFlag
                            countryCode={entry.country}
                            size="md"
                            showCode={true}
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm sm:text-base">
                          {formatNumber(entry.totalScore)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
