/**
 * Network Service
 * Monitors network connectivity and manages offline/online states
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Network status callback type
 */
type NetworkCallback = (isConnected: boolean) => void;

/**
 * Network Service class
 * Provides network monitoring and connectivity checking
 */
class NetworkService {
  private listeners: NetworkCallback[] = [];
  private isConnected: boolean = true;
  private unsubscribe: (() => void) | null = null;

  /**
   * Initialize network monitoring
   * Sets up listener for network state changes
   */
  initialize(): void {
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      
      if (connected !== this.isConnected) {
        this.isConnected = connected;
        this.notifyListeners(connected);
      }
    });
  }

  /**
   * Clean up network monitoring
   * Removes event listener
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Get current network connection status
   * @returns True if connected to network
   */
  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;
    return this.isConnected;
  }

  /**
   * Get cached connection status
   * @returns Last known connection status
   */
  isOnline(): boolean {
    return this.isConnected;
  }

  /**
   * Register callback for network status changes
   * @param callback Function to call when network status changes
   * @returns Unsubscribe function
   */
  addListener(callback: NetworkCallback): () => void {
    this.listeners.push(callback);
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all registered listeners of network status change
   * @param isConnected Current connection status
   */
  private notifyListeners(isConnected: boolean): void {
    this.listeners.forEach(callback => callback(isConnected));
  }
}

export const networkService = new NetworkService();