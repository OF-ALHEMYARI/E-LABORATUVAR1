import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Replace with your Firebase configuration
  apiKey: "AIzaSyCC9_ysVTN-BStb6L5idQIQaumRp_VxbRk",
  authDomain: "e-laboratuvar-f688d.firebaseapp.com",
  projectId: "e-laboratuvar-f688d",
  storageBucket: "e-laboratuvar-f688d.firebasestorage.app",
  messagingSenderId: "991654678991",
  appId: "1:991654678991:web:95193f32f1f8166e37c2ba",
  databaseURL: "https://e-laboratuvar-f688d-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
