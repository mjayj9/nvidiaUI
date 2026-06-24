import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: 이곳에 Firebase Console에서 발급받은 Config 키값들을 입력하세요.
const firebaseConfig = {
  projectId: "focused-rig-vcf5x",
  appId: "1:595387634191:web:fe3cf3dd9312147f81c97a",
  apiKey: "AIzaSyBbuN7CBGCX_dzxAmM1fhj8GDNeAFZv_tI",
  authDomain: "focused-rig-vcf5x.firebaseapp.com",
  storageBucket: "focused-rig-vcf5x.firebasestorage.app",
  messagingSenderId: "595387634191",
  measurementId: "",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let customDb: Firestore;
let defaultDb: Firestore;
let isUsingDefault = false;

try {
  customDb = getFirestore(app, "ai-studio-1fe82f92-e13f-4326-b520-81baed7c073b");
  defaultDb = getFirestore(app);
} catch (e) {
  customDb = getFirestore(app);
  defaultDb = customDb;
  isUsingDefault = true;
}

export let db: Firestore = customDb;

export const switchToDefaultDatabase = () => {
  if (!isUsingDefault) {
    db = defaultDb;
    isUsingDefault = true;
    console.warn("Switched Firestore to default database reference");
  }
};

export const storage = getStorage(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    if (error.code === "auth/unauthorized-domain") {
      throw error;
    }
    console.warn("signInWithPopup failed, attempting signInWithRedirect", error);
    try {
      await signInWithRedirect(auth, provider);
    } catch (redirectError) {
      console.error("signInWithRedirect failed as well", redirectError);
      throw redirectError;
    }
  }
};

export const signOut = async () => {
  try {
    localStorage.removeItem("nim_guest_user");
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Firebase signOut error:", error);
  } finally {
    window.location.reload();
  }
};
