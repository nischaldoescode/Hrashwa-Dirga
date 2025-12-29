/**
 * Firebase Admin SDK Configuration
 * Handles Firebase initialization for authentication verification
 * Used to verify ID tokens from React Native app Google Sign-In
 */

const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for secure credential management
 * Only initializes once even if called multiple times
 * @returns {admin.app.App} Firebase Admin app instance
 */
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized to prevent duplicate initialization
    if (admin.apps.length === 0) {
      // Initialize with service account credentials from environment variables
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Private key needs proper newline formatting (replace escaped \\n with actual newlines)
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });

      console.log('Firebase Admin initialized successfully');
    }

    return admin;
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
};

/**
 * Verify Firebase ID token from mobile app
 * Used in authentication middleware to validate user requests
 * Decodes token and extracts user information
 * @param {string} idToken - Firebase ID token received from React Native client
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token containing user UID, email, etc.
 * @throws {Error} If token is invalid, expired, or verification fails
 */
const verifyIdToken = async (idToken) => {
  try {
    // Verify the ID token and decode its payload
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error.message);
    throw new Error('Invalid or expired authentication token');
  }
};

/**
 * Get Firebase user details by UID
 * Used to fetch complete user profile from Firebase Authentication
 * @param {string} uid - Firebase user unique identifier
 * @returns {Promise<admin.auth.UserRecord>} Complete user record from Firebase
 * @throws {Error} If user not found or fetch fails
 */
const getUserByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user by UID:', error.message);
    throw new Error('User not found in Firebase Authentication');
  }
};

/**
 * Get Firebase user by email address
 * Used for admin operations or user lookups
 * @param {string} email - User email address
 * @returns {Promise<admin.auth.UserRecord>} User record from Firebase
 * @throws {Error} If user not found
 */
const getUserByEmail = async (email) => {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user by email:', error.message);
    throw new Error('User not found with provided email');
  }
};

module.exports = {
  initializeFirebase,
  verifyIdToken,
  getUserByUid,
  getUserByEmail,
  admin,
};