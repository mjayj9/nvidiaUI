import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 기본 Firebase 구성 값 (Focused-Rig 프로젝트)
const defaultFirebaseConfig = {
  projectId: "focused-rig-vcf5x",
  appId: "1:595387634191:web:fe3cf3dd9312147f81c97a",
  apiKey: "AIzaSyBbuN7CBGCX_dzxAmM1fhj8GDNeAFZv_tI",
  authDomain: "focused-rig-vcf5x.firebaseapp.com",
  storageBucket: "focused-rig-vcf5x.firebasestorage.app",
  messagingSenderId: "595387634191",
  measurementId: "",
};

let firebaseConfig = defaultFirebaseConfig;
let isCustomConfigUsed = false;

if (typeof window !== "undefined") {
  const savedConfig = localStorage.getItem("nim_custom_firebase_config");
  if (savedConfig) {
    try {
      firebaseConfig = JSON.parse(savedConfig);
      isCustomConfigUsed = true;
      console.log("Initialized custom Firebase Project:", firebaseConfig.projectId);
    } catch (e) {
      console.error("Failed to parse custom Firebase config", e);
    }
  }
}

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

let customDb: Firestore;
let defaultDb: Firestore;
let isUsingDefault = false;

try {
  if (isCustomConfigUsed) {
    // 사용자 지정 파이어베이스 프로젝트에서는 네임드 데이터베이스(ai-studio-...)가 없으므로 (default) 데이터베이스를 바로 사용합니다.
    customDb = getFirestore(app);
    defaultDb = customDb;
    isUsingDefault = true;
  } else {
    customDb = getFirestore(app, "ai-studio-1fe82f92-e13f-4326-b520-81baed7c073b");
    defaultDb = getFirestore(app);
  }
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
