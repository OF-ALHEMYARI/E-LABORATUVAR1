import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  updateProfile,
  sendEmailVerification,
  deleteUser,
} from "firebase/auth";
import { auth, db } from "../config/firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

class FirebaseAuthService {
  // User Registration
  async registerUser(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
        photoURL: userData.photoURL || null,
      });

      const newUserData = {
        ...userData,
        uid: user.uid,
      };
      const userRef = await addDoc(collection(db, "users"), newUserData);
      console.log(userRef.id);
      return user;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }

  // User Login
  async loginUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userCollection = collection(db, `users`);
      const userQuery = query(
        userCollection,
        where("uid", "==", userCredential.user.uid)
      );
      const user = await getDocs(userQuery).then((querySnapshot) => {
        return querySnapshot.docs[0];
      });
      return user.data();
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  // User Logout
  async logoutUser() {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  // Password Reset
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error sending password reset:", error);
      throw error;
    }
  }

  // Update User Profile
  async updateUserProfile(userData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      await updateProfile(user, {
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      });

      if (userData.email && userData.email !== user.email) {
        await updateEmail(user, userData.email);
        await sendEmailVerification(user);
      }

      if (userData.password) {
        await updatePassword(user, userData.password);
      }

      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Delete User Account
  async deleteUserAccount() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      await deleteUser(user);
      return true;
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  }

  // Get Current User
  getCurrentUser() {
    return auth.currentUser;
  }

  // Check Auth State
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }

  // Check if User is Authenticated
  isAuthenticated() {
    return !!auth.currentUser;
  }

  // Get User Token
  async getUserToken() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      return await user.getIdToken();
    } catch (error) {
      console.error("Error getting user token:", error);
      throw error;
    }
  }

  // Refresh User Token
  async refreshUserToken() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      await user.getIdToken(true);
      return true;
    } catch (error) {
      console.error("Error refreshing user token:", error);
      throw error;
    }
  }

  // Check Email Verification Status
  isEmailVerified() {
    const user = auth.currentUser;
    return user ? user.emailVerified : false;
  }

  // Resend Verification Email
  async resendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      await sendEmailVerification(user);
      return true;
    } catch (error) {
      console.error("Error resending verification email:", error);
      throw error;
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
