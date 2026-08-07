import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
let firebaseConfig: any = null;
try {
  // @ts-ignore
  firebaseConfig = require("../../firebase-applet-config.json");
} catch {
  firebaseConfig = null;
}

// Initialize Firebase App safely
const dummyConfig = {
  apiKey: "AIzaSyDummyKeyForSandboxLocalModeOnly",
  authDomain: "sandbox-app.firebaseapp.com",
  projectId: "sandbox-app",
  storageBucket: "sandbox-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  firestoreDatabaseId: "(default)"
};

const finalConfig = (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 5)
  ? firebaseConfig
  : dummyConfig;

export const isDummyFirebase = !firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("Dummy");

const app = initializeApp(finalConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
let _googleProvider: GoogleAuthProvider | null = null;
export function getGoogleProvider(): GoogleAuthProvider {
  if (!_googleProvider) {
    try {
      _googleProvider = new GoogleAuthProvider();
    } catch (e) {
      console.warn("Failed to construct GoogleAuthProvider:", e);
      _googleProvider = {} as GoogleAuthProvider;
    }
  }
  return _googleProvider;
}

// Initialize Firestore DB
export const db = finalConfig.firestoreDatabaseId && finalConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, finalConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface FormattedAuthError {
  code: string;
  title: string;
  message: string;
  domain?: string;
  isDomainError?: boolean;
  rawError?: string;
}

export function getFriendlyAuthErrorMessage(error: any): FormattedAuthError {
  const code = error?.code || '';
  const rawMsg = error?.message || String(error || '');
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your-app-domain.com';

  if (code === 'auth/unauthorized-domain' || rawMsg.includes('unauthorized-domain')) {
    return {
      code: 'auth/unauthorized-domain',
      title: 'Domain Not Authorized in Firebase',
      domain: currentDomain,
      isDomainError: true,
      message: `Your current host domain (${currentDomain}) is not authorized in Firebase Console for Google Sign-In.`,
      rawError: rawMsg
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      code: 'auth/popup-blocked',
      title: 'Login Popup Blocked',
      message: 'The Google Sign-In popup was blocked by your browser. Please allow popups for this site in your browser URL bar and try again.',
      rawError: rawMsg
    };
  }

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return {
      code: 'auth/popup-closed-by-user',
      title: 'Sign-In Window Closed',
      message: 'The Google Sign-In window was closed before completing authentication.',
      rawError: rawMsg
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code: 'auth/operation-not-allowed',
      title: 'Google Provider Disabled',
      message: 'Google Sign-In is disabled in your Firebase console. Please enable Google under Authentication -> Sign-in method in Firebase Console.',
      rawError: rawMsg
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code: 'auth/network-request-failed',
      title: 'Network Connection Error',
      message: 'Network request failed while contacting Google Authentication services. Please verify your connection.',
      rawError: rawMsg
    };
  }

  return {
    code: code || 'auth/unknown',
    title: 'Google Authentication Error',
    message: rawMsg || 'An error occurred during Google Sign-In. You can also log in using Username & Password below.',
    rawError: rawMsg
  };
}

// Authentication Helpers
export async function signInWithGoogle() {
  const provider = getGoogleProvider();
  if (provider.setCustomParameters) {
    provider.setCustomParameters({ prompt: 'select_account' });
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.warn("Google Authentication warning/error:", error);
    const friendly = getFriendlyAuthErrorMessage(error);
    const customErr = new Error(friendly.message) as any;
    customErr.authDetails = friendly;
    customErr.code = error.code || friendly.code;
    throw customErr;
  }
}

export async function logOutUser() {
  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore User Profile Sync Helpers
export interface UserFirebaseRecord {
  uid: string;
  email: string | null;
  displayName: string | null;
  userState: any;
  roadmap: any[] | null;
  resumeAnalysis: any | null;
  updatedAt: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function syncUserStateToFirebase(
  uid: string,
  email: string | null,
  displayName: string | null,
  userState: any,
  roadmap: any[] | null,
  resumeAnalysis: any | null
) {
  if (isDummyFirebase) return;
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      uid,
      email: email || uid,
      displayName: displayName || uid,
      userState,
      roadmap,
      resumeAnalysis,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err: any) {
    if (err?.message?.includes("offline")) {
      console.warn("Firestore is currently offline. State saved locally in Sandbox cache.");
    } else if (err?.message?.includes("permission") || err?.message?.includes("insufficient")) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } else {
      console.warn("Firestore sync deferred (offline/unreachable):", err?.message || err);
    }
  }
}

export async function fetchUserStateFromFirebase(uid: string): Promise<UserFirebaseRecord | null> {
  if (isDummyFirebase) return null;
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserFirebaseRecord;
    }
  } catch (err: any) {
    if (err?.message?.includes("offline")) {
      console.warn("Firestore is offline. Falling back to local offline sandbox state.");
    } else if (err?.message?.includes("permission") || err?.message?.includes("insufficient")) {
      handleFirestoreError(err, OperationType.GET, path);
    } else {
      console.warn("Firestore fetch bypassed (offline/unreachable):", err?.message || err);
    }
  }
  return null;
}

export async function fetchAllCandidatesFromFirebase(): Promise<UserFirebaseRecord[]> {
  if (isDummyFirebase) return [];
  const path = "users";
  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    const results: UserFirebaseRecord[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        results.push(docSnap.data() as UserFirebaseRecord);
      }
    });
    return results;
  } catch (err: any) {
    console.warn("Unable to fetch all candidate records from Firestore:", err?.message || err);
    return [];
  }
}

export async function syncFeedbackToFirebase(feedbackData: any) {
  if (isDummyFirebase) return;
  try {
    const fbRef = doc(db, "feedbacks", feedbackData.id || `fb_${Date.now()}`);
    await setDoc(fbRef, {
      ...feedbackData,
      createdAt: Date.now()
    }, { merge: true });
  } catch (err: any) {
    console.warn("Feedback Firestore sync skipped/deferred:", err?.message || err);
  }
}

export async function fetchAllFeedbacksFromFirebase(): Promise<any[]> {
  if (isDummyFirebase) return [];
  try {
    const colRef = collection(db, "feedbacks");
    const snapshot = await getDocs(colRef);
    const results: any[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        results.push(docSnap.data());
      }
    });
    return results;
  } catch (err: any) {
    console.warn("Unable to fetch feedbacks from Firestore:", err?.message || err);
    return [];
  }
}

