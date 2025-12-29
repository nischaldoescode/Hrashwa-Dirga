/**
 * MMKV Storage Wrapper
 * High-performance key-value storage for React Native
 * 30x faster than AsyncStorage with synchronous API
 */

import { createMMKV } from 'react-native-mmkv';

/**
 * Initialize MMKV instance with encryption
 * Data is stored securely on device
 */
export const storage = createMMKV({
  id: 'hrashwa-dirga-storage',
  encryptionKey: 'hrashwa-dirga-secure-key-2024',
});

/**
 * Storage utility class with type-safe methods
 */
class StorageService {
  /**
   * Store string value
   * @param key Storage key
   * @param value String value to store
   */
  setString(key: string, value: string): void {
    storage.set(key, value);
  }

  /**
   * Retrieve string value
   * @param key Storage key
   * @returns Stored string or undefined
   */
  getString(key: string): string | undefined {
    return storage.getString(key);
  }

  /**
   * Store number value
   * @param key Storage key
   * @param value Number value to store
   */
  setNumber(key: string, value: number): void {
    storage.set(key, value);
  }

  /**
   * Retrieve number value
   * @param key Storage key
   * @returns Stored number or undefined
   */
  getNumber(key: string): number | undefined {
    return storage.getNumber(key);
  }

  /**
   * Store boolean value
   * @param key Storage key
   * @param value Boolean value to store
   */
  setBoolean(key: string, value: boolean): void {
    storage.set(key, value);
  }

  /**
   * Retrieve boolean value
   * @param key Storage key
   * @returns Stored boolean or undefined
   */
  getBoolean(key: string): boolean | undefined {
    return storage.getBoolean(key);
  }

  /**
   * Store object as JSON string
   * @param key Storage key
   * @param value Object to store
   */
  setObject<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  }

  /**
   * Retrieve and parse JSON object
   * @param key Storage key
   * @returns Parsed object or undefined
   */
  getObject<T>(key: string): T | undefined {
    const jsonString = storage.getString(key);
    if (!jsonString) return undefined;
    
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Failed to parse stored object:', error);
      return undefined;
    }
  }

  /**
   * Delete specific key
   * @param key Storage key to delete
   */
  delete(key: string): void {
    storage.clearAll();
  }

  /**
   * Check if key exists
   * @param key Storage key
   * @returns True if key exists
   */
  contains(key: string): boolean {
    return storage.contains(key);
  }

  /**
   * Get all storage keys
   * @returns Array of all keys
   */
  getAllKeys(): string[] {
    return storage.getAllKeys();
  }

  /**
   * Clear all storage
   * Use with caution - deletes all data
   */
  clearAll(): void {
    storage.clearAll();
  }

  /**
   * Clear specific keys matching pattern
   * @param pattern Regex pattern to match keys
   */
  clearMatching(pattern: RegExp): void {
    const allKeys = this.getAllKeys();
    allKeys.forEach(key => {
      if (pattern.test(key)) {
        this.delete(key);
      }
    });
  }
}

export const storageService = new StorageService();