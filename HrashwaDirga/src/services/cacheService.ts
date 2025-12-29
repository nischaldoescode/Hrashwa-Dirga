/**
 * Cache Service
 * Manages local caching strategy for offline support and performance
 * Implements multi-layer caching with expiration handling
 */

import { storageService } from '@/utils/storage';
import { STORAGE_KEYS, CACHE_EXPIRY } from '@/utils/constants';
import { Level, Question, LeaderboardEntry, AppConfig } from '@/types/game.types';
import { User } from '@/types/auth.types';

/**
 * Cache entry wrapper with timestamp for expiration checking
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Cache Service class
 * Provides methods for caching and retrieving data with expiration
 */
class CacheService {
  /**
   * Check if cached data is still valid
   * @param timestamp Cache entry timestamp
   * @returns True if cache is still fresh
   */
  private isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp < CACHE_EXPIRY;
  }

  /**
   * Store data in cache with timestamp
   * @param key Storage key
   * @param data Data to cache
   */
  private setCache<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    storageService.setObject(key, entry);
  }

  /**
   * Retrieve data from cache if valid
   * @param key Storage key
   * @returns Cached data or null if expired/missing
   */
  private getCache<T>(key: string): T | null {
    const entry = storageService.getObject<CacheEntry<T>>(key);
    
    if (!entry) return null;
    
    if (!this.isCacheValid(entry.timestamp)) {
      storageService.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache user data
   * @param user User object to cache
   */
  cacheUser(user: User): void {
    this.setCache(STORAGE_KEYS.USER_DATA, user);
  }

  /**
   * Retrieve cached user data
   * @returns Cached user or null
   */
  getCachedUser(): User | null {
    return this.getCache<User>(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Cache app configuration
   * @param config App configuration object
   */
  cacheConfig(config: AppConfig): void {
    this.setCache(STORAGE_KEYS.APP_CONFIG, config);
  }

  /**
   * Retrieve cached app configuration
   * @returns Cached config or null
   */
  getCachedConfig(): AppConfig | null {
    return this.getCache<AppConfig>(STORAGE_KEYS.APP_CONFIG);
  }

  /**
   * Cache levels data
   * @param levels Array of levels
   */
  cacheLevels(levels: Level[]): void {
    this.setCache(STORAGE_KEYS.LEVELS_CACHE, levels);
  }

  /**
   * Retrieve cached levels
   * @returns Cached levels array or null
   */
  getCachedLevels(): Level[] | null {
    return this.getCache<Level[]>(STORAGE_KEYS.LEVELS_CACHE);
  }

  /**
   * Cache questions for specific level
   * @param levelId Level identifier
   * @param questions Array of questions
   */
  cacheQuestions(levelId: string, questions: Question[]): void {
    const key = `${STORAGE_KEYS.QUESTIONS_CACHE}_${levelId}`;
    this.setCache(key, questions);
  }

  /**
   * Retrieve cached questions for level
   * @param levelId Level identifier
   * @returns Cached questions or null
   */
  getCachedQuestions(levelId: string): Question[] | null {
    const key = `${STORAGE_KEYS.QUESTIONS_CACHE}_${levelId}`;
    return this.getCache<Question[]>(key);
  }

  /**
   * Cache leaderboard data
   * @param leaderboard Array of leaderboard entries
   */
  cacheLeaderboard(leaderboard: LeaderboardEntry[]): void {
    this.setCache(STORAGE_KEYS.LEADERBOARD_CACHE, leaderboard);
  }

  /**
   * Retrieve cached leaderboard
   * @returns Cached leaderboard or null
   */
  getCachedLeaderboard(): LeaderboardEntry[] | null {
    return this.getCache<LeaderboardEntry[]>(STORAGE_KEYS.LEADERBOARD_CACHE);
  }

  /**
   * Update last sync timestamp
   * Tracks when data was last synchronized with backend
   */
  updateLastSync(): void {
    storageService.setNumber(STORAGE_KEYS.LAST_SYNC, Date.now());
  }

  /**
   * Get last sync timestamp
   * @returns Timestamp of last sync or null
   */
  getLastSync(): number | null {
    return storageService.getNumber(STORAGE_KEYS.LAST_SYNC) || null;
  }

  /**
   * Clear all cached data
   * Used when user logs out or cache becomes corrupted
   */
  clearAllCache(): void {
    storageService.delete(STORAGE_KEYS.USER_DATA);
    storageService.delete(STORAGE_KEYS.APP_CONFIG);
    storageService.delete(STORAGE_KEYS.LEVELS_CACHE);
    storageService.delete(STORAGE_KEYS.LEADERBOARD_CACHE);
    storageService.clearMatching(/questions_cache_/);
  }

  /**
   * Clear expired cache entries
   * Runs periodically to free up storage
   */
  clearExpiredCache(): void {
    const keys = storageService.getAllKeys();
    
    keys.forEach(key => {
      const entry = storageService.getObject<CacheEntry<any>>(key);
      if (entry && !this.isCacheValid(entry.timestamp)) {
        storageService.delete(key);
      }
    });
  }

  /**
   * Check if app needs data refresh
   * Based on last sync time and cache expiry
   * @returns True if refresh is needed
   */
  needsRefresh(): boolean {
    const lastSync = this.getLastSync();
    if (!lastSync) return true;
    
    return !this.isCacheValid(lastSync);
  }
}

export const cacheService = new CacheService();