import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';
import FirebaseErrorHandler from './firebaseErrorHandler';

class FirebaseInitializer {
  constructor() {
    this.app = null;
    this.firestore = null;
    this.auth = null;
    this.storage = null;
    this.initialized = false;
  }

  async initialize(config = null) {
    try {
      if (this.initialized) {
        console.warn('Firebase already initialized');
        return this.getInstances();
      }

      const firebaseConfig = config || {
        // Default development configuration
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      };

      // Initialize Firebase if not already initialized
      if (!getApps().length) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }

      // Initialize Firestore with persistence
      this.firestore = initializeFirestore(this.app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });

      // Enable offline persistence for Firestore
      try {
        await enableIndexedDbPersistence(this.firestore);
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.');
        }
      }

      // Initialize Auth with AsyncStorage persistence
      this.auth = initializeAuth(this.app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });

      // Initialize Storage
      this.storage = getStorage(this.app);

      this.initialized = true;
      console.log('Firebase successfully initialized');

      return this.getInstances();
    } catch (error) {
      const handledError = await FirebaseErrorHandler.handleError(error, 'initialization');
      console.error('Firebase initialization failed:', handledError);
      throw handledError;
    }
  }

  getInstances() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }

    return {
      app: this.app,
      firestore: this.firestore,
      auth: this.auth,
      storage: this.storage
    };
  }

  async configureFirestore() {
    try {
      // Configure Firestore settings
      const settings = {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        ignoreUndefinedProperties: true
      };

      await this.firestore.settings(settings);

      // Enable network status monitoring
      this.firestore.enableNetwork();

      return true;
    } catch (error) {
      const handledError = await FirebaseErrorHandler.handleError(error, 'firestore');
      console.error('Firestore configuration failed:', handledError);
      throw handledError;
    }
  }

  async configureAuth() {
    try {
      // Configure Auth settings
      await this.auth.useDeviceLanguage();
      
      // Set persistence to LOCAL
      await this.auth.setPersistence('LOCAL');

      return true;
    } catch (error) {
      const handledError = await FirebaseErrorHandler.handleError(error, 'auth');
      console.error('Auth configuration failed:', handledError);
      throw handledError;
    }
  }

  async configureStorage() {
    try {
      // Configure Storage settings
      this.storage.setMaxUploadRetryTime(10000);
      this.storage.setMaxDownloadRetryTime(10000);

      return true;
    } catch (error) {
      const handledError = await FirebaseErrorHandler.handleError(error, 'storage');
      console.error('Storage configuration failed:', handledError);
      throw handledError;
    }
  }

  async validateConfig(config) {
    const requiredFields = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ];

    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
    }

    return true;
  }

  async checkConnection() {
    try {
      // Check Firestore connection
      const firestoreConnected = await this.firestore.terminate()
        .then(() => this.firestore.clearPersistence())
        .then(() => true)
        .catch(() => false);

      // Check Auth connection
      const authConnected = await this.auth.currentUser?.reload()
        .then(() => true)
        .catch(() => false);

      // Check Storage connection
      const storageConnected = await this.storage.ref().root
        .listAll()
        .then(() => true)
        .catch(() => false);

      return {
        firestore: firestoreConnected,
        auth: authConnected,
        storage: storageConnected,
        overall: firestoreConnected && authConnected && storageConnected
      };
    } catch (error) {
      const handledError = await FirebaseErrorHandler.handleError(error, 'connection');
      console.error('Connection check failed:', handledError);
      throw handledError;
    }
  }

  async terminate() {
    try {
      if (!this.initialized) {
        return true;
      }

      // Terminate Firestore
      await this.firestore.terminate();

      // Sign out from Auth
      if (this.auth.currentUser) {
        await this.auth.signOut();
      }

      this.initialized = false;
      return true;
    } catch (error) {
      const handledError = await FirebaseErrorHandler.handleError(error, 'termination');
      console.error('Firebase termination failed:', handledError);
      throw handledError;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  getApp() {
    return this.app;
  }

  getFirestore() {
    return this.firestore;
  }

  getAuth() {
    return this.auth;
  }

  getStorage() {
    return this.storage;
  }
}

// Create and export singleton instance
const firebaseInitializer = new FirebaseInitializer();
export default firebaseInitializer;
