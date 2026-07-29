import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInAnonymously,
    signInWithPopup,
    signOut as firebaseSignOut,
    type User,
} from 'firebase/auth';
import { getFirebaseAuthInstance } from './firebase-config';

let signedInUserPromise: Promise<User> | undefined;

// Firestore security rules key every permission check off request.auth.uid,
// so every cloud-mode client needs *some* identity, even a visitor who just
// opened a share link and never signed up. Anonymous auth covers that case;
// a real sign-in provider (Google/GitHub/email) can be layered on top later
// so a user's diagrams follow them across devices/browsers.
export function ensureSignedIn(): Promise<User> {
    if (signedInUserPromise) {
        return signedInUserPromise;
    }

    const auth = getFirebaseAuthInstance();

    signedInUserPromise = new Promise<User>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                if (user) {
                    unsubscribe();
                    resolve(user);
                    return;
                }

                signInAnonymously(auth).catch((err) => {
                    unsubscribe();
                    reject(err);
                });
            },
            (err) => {
                unsubscribe();
                reject(err);
            }
        );
    });

    return signedInUserPromise;
}

export function getCurrentUserId(): string | undefined {
    return getFirebaseAuthInstance().currentUser?.uid;
}

export function signInWithGoogle(): Promise<User> {
    const auth = getFirebaseAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    return signInWithPopup(auth, provider).then((result) => result.user);
}

export function signOutUser(): Promise<void> {
    signedInUserPromise = undefined;
    return firebaseSignOut(getFirebaseAuthInstance());
}

export function onAuthChange(
    callback: (user: User | null) => void
): () => void {
    const auth = getFirebaseAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, callback);
    return unsubscribe;
}

export const REQUIRED_EMAIL_DOMAIN = 'rome2rio.com';

export function isEmailAllowed(email: string | null | undefined): boolean {
    if (!email) return false;
    return email.endsWith(`@${REQUIRED_EMAIL_DOMAIN}`);
}
