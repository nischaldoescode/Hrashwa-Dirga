/**
 * Database Configuration
 * Handles MongoDB connection with retry logic and proper error handling
 * This module provides connection management for production reliability
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB database
 * Implements connection retry logic for production reliability
 * Uses connection pooling and optimized settings for performance
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
  try {
    // MongoDB connection options for optimal performance and reliability
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      serverSelectionTimeoutMS: 5000, // Timeout for initial server selection
      socketTimeoutMS: 45000, // Socket timeout for operations
      family: 4, // Use IPv4, skip trying IPv6 for faster connections
    };

    // Attempt to establish connection with configured options
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    // Log successful connection details for monitoring
    console.log('MongoDB Connected:', conn.connection.host);
    console.log('Database Name:', conn.connection.name);

    // Set up event handlers for connection lifecycle management
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Handle disconnection events
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    // Handle successful reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    
    // In production, retry connection after 5 seconds instead of crashing
    if (process.env.NODE_ENV === 'production') {
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectDatabase, 5000);
    } else {
      // In development, exit immediately for faster debugging
      process.exit(1);
    }
  }
};

/**
 * Gracefully closes database connection
 * Used during application shutdown to properly cleanup resources
 * Ensures all pending operations complete before closing
 * @returns {Promise<void>}
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed gracefully');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};