import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

async function ensureAuth() {
  if (!auth.currentUser) throw new Error("Not signed in");
  return auth.currentUser;
}

export async function loadVisited() {
  const user = await ensureAuth();
  const ref = doc(db, "users", user.uid, "state", "visited");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().countries ?? [] : [];
}

export async function saveVisited(countries) {
  const user = await ensureAuth();
  const ref = doc(db, "users", user.uid, "state", "visited");
  await setDoc(ref, { countries, updatedAt: Date.now() }, { merge: true });
}

/**
 * public profile を取得
 * - アプリ内表示名: publicDisplayName を使う
 */
export async function loadPublicProfile(uid) {
  const ref = doc(db, "users", uid, "profile", "public");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * public profile をアップサート（アプリ内表示名を保存）
 * Googleの displayName は保存に使わない（実名事故防止）
 */
export async function savePublicProfile(uid, profilePatch) {
  const ref = doc(db, "users", uid, "profile", "public");
  await setDoc(
    ref,
    {
      ...profilePatch,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

/**
 * 初回だけ doc が無い場合に最低限作る（任意）
 * photoURL は保存しても良いが、表示名は絶対入れない
 */
export async function ensurePublicProfile(uid) {
  const ref = doc(db, "users", uid, "profile", "public");
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(
    ref,
    {
      publicDisplayName: "", // 未設定
      photoURL: auth.currentUser?.photoURL ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export async function loadVisitedByUid(uid) {
  const ref = doc(db, "users", uid, "state", "visited");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().countries ?? [] : [];
}
