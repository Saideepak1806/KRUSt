import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore DB
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Authentication Helpers
export async function signInWithGoogle() {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn("Google Authentication warning/error:", error);
    throw error;
  }
}

export async function logOutUser() {
  await signOut(auth);
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
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      uid,
      email,
      displayName,
      userState,
      roadmap,
      resumeAnalysis,
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
