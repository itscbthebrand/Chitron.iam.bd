import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  type User as FirebaseUser, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore, onSnapshot, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Ensure local persistence
setPersistence(auth, browserLocalPersistence);

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  photoURL?: string;
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (emailOrUsername: string, pass: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch profile
        const d = await getDoc(doc(db, "users", u.uid));
        if (d.exists()) {
          setProfile(d.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signUp = async (data: any) => {
    const { email, password, username, firstName, lastName, phoneNumber } = data;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userProfile = {
      uid: cred.user.uid,
      email,
      username,
      firstName,
      lastName,
      phoneNumber,
      createdAt: serverTimestamp(),
      photoURL: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`
    };
    await setDoc(doc(db, "users", cred.user.uid), userProfile);
  };

  const signInEmail = async (loginId: string, pass: string) => {
    // Basic logic: if loginId is email, use it. If not, we might need a lookup (index) in real apps.
    // For this prototype, we assume loginId is email or we would query Firestore users collection first.
    await signInWithEmailAndPassword(auth, loginId, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), data);
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, signInGoogle, signInEmail, signUp, logout, updateProfileData }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase must be used within FirebaseProvider");
  return context;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
