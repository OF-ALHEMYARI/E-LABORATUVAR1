class FirebaseErrorHandler {
  static handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/operation-not-allowed': 'Operation not allowed.',
      'auth/weak-password': 'Password is too weak.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-verification-code': 'Invalid verification code.',
      'auth/invalid-verification-id': 'Invalid verification ID.',
      'auth/invalid-phone-number': 'Invalid phone number.',
      'auth/missing-phone-number': 'Missing phone number.',
      'auth/quota-exceeded': 'SMS quota exceeded.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/requires-recent-login': 'Please log in again to complete this action.',
      'auth/email-not-verified': 'Please verify your email address.'
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || error.message,
      originalError: error
    };
  }

  static handleFirestoreError(error) {
    const errorMessages = {
      'permission-denied': 'You do not have permission to perform this action.',
      'not-found': 'The requested document was not found.',
      'already-exists': 'The document already exists.',
      'failed-precondition': 'Operation failed due to document state.',
      'out-of-range': 'Operation was attempted past the valid range.',
      'unauthenticated': 'User is not authenticated.',
      'unavailable': 'Service is temporarily unavailable.',
      'data-loss': 'Unrecoverable data loss or corruption.',
      'cancelled': 'Operation was cancelled.',
      'unknown': 'Unknown error occurred.',
      'invalid-argument': 'Invalid argument provided.',
      'deadline-exceeded': 'Operation deadline exceeded.',
      'resource-exhausted': 'Resource has been exhausted.'
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || error.message,
      originalError: error
    };
  }

  static handleStorageError(error) {
    const errorMessages = {
      'storage/unknown': 'Unknown error occurred.',
      'storage/object-not-found': 'File not found.',
      'storage/bucket-not-found': 'Storage bucket not found.',
      'storage/project-not-found': 'Project not found.',
      'storage/quota-exceeded': 'Storage quota exceeded.',
      'storage/unauthenticated': 'User is not authenticated.',
      'storage/unauthorized': 'User is not authorized.',
      'storage/retry-limit-exceeded': 'Maximum retry time exceeded.',
      'storage/invalid-checksum': 'File checksum mismatch.',
      'storage/canceled': 'Operation cancelled.',
      'storage/invalid-event-name': 'Invalid event name.',
      'storage/invalid-url': 'Invalid URL.',
      'storage/invalid-argument': 'Invalid argument provided.',
      'storage/no-default-bucket': 'No default bucket.',
      'storage/cannot-slice-blob': 'Cannot slice blob.',
      'storage/server-file-wrong-size': 'File size mismatch.'
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || error.message,
      originalError: error
    };
  }

  static handleRealtimeDatabaseError(error) {
    const errorMessages = {
      'permission-denied': 'You do not have permission to perform this action.',
      'disconnected': 'Client is disconnected.',
      'expired-token': 'Authentication token has expired.',
      'invalid-token': 'Authentication token is invalid.',
      'max-retries': 'Maximum retry attempts reached.',
      'network-error': 'Network error occurred.',
      'operation-failed': 'Operation failed.',
      'overridden-by-set': 'Data was overwritten.',
      'unavailable': 'Service is unavailable.',
      'unknown': 'Unknown error occurred.',
      'user-code-exception': 'Exception in user code.',
      'write-canceled': 'Write operation was cancelled.'
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || error.message,
      originalError: error
    };
  }

  static logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        stack: error.stack
      },
      context: {
        ...context,
        environment: process.env.NODE_ENV,
        platform: process.platform
      }
    };

    console.error('Firebase Error:', errorLog);

    // You can implement additional error logging here
    // For example, sending to a logging service or saving to a log file
  }

  static async handleError(error, type = 'general', context = {}) {
    // Log the error
    this.logError(error, context);

    // Handle different types of Firebase errors
    switch (type) {
      case 'auth':
        return this.handleAuthError(error);
      case 'firestore':
        return this.handleFirestoreError(error);
      case 'storage':
        return this.handleStorageError(error);
      case 'database':
        return this.handleRealtimeDatabaseError(error);
      default:
        return {
          code: error.code || 'unknown',
          message: error.message || 'An unknown error occurred',
          originalError: error
        };
    }
  }

  static isOperationalError(error) {
    const operationalErrors = [
      'auth/user-not-found',
      'auth/wrong-password',
      'permission-denied',
      'not-found',
      'storage/object-not-found',
      'storage/unauthorized'
    ];

    return operationalErrors.includes(error.code);
  }

  static shouldRetry(error) {
    const retryableErrors = [
      'storage/retry-limit-exceeded',
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted'
    ];

    return retryableErrors.includes(error.code);
  }
}

export default FirebaseErrorHandler;
