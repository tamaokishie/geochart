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

export async function savePublicProfile(user) {
  const ref = doc(db, "users", user.uid, "profile", "public");
  await setDoc(
    ref,
    {
      displayName: user.displayName ?? "Anonymous",
      photoURL: user.photoURL ?? null,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export async function loadPublicProfile(uid) {
  const ref = doc(db, "users", uid, "profile", "public");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function loadVisitedByUid(uid) {
  const ref = doc(db, "users", uid, "state", "visited");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().countries ?? [] : [];
}
