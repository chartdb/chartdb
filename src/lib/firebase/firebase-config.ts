import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    type Firestore,
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import {
    FIREBASE_API_KEY,
    FIREBASE_APP_ID,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
} from '@/lib/env';

// Cloud/shared diagrams require a Firebase project. This module is only
// touched when STORAGE_MODE === 'cloud' (see src/lib/env.ts), so builds that
// never enable cloud storage never need Firebase credentials.
export const isFirebaseConfigured: boolean = Boolean(
    FIREBASE_API_KEY && FIREBASE_PROJECT_ID && FIREBASE_APP_ID
);

let app: FirebaseApp | undefined;
let firestoreDb: Firestore | undefined;
let firebaseAuth: Auth | undefined;

function getFirebaseApp(): FirebaseApp {
    if (!isFirebaseConfigured) {
        throw new Error(
            'Firebase is not configured. Set VITE_FIREBASE_* environment variables (see README) before using STORAGE_MODE=cloud.'
        );
    }

    if (getApps().length > 0) {
        return getApps()[0];
    }

    if (!app) {
        app = initializeApp({
            apiKey: FIREBASE_API_KEY,
            authDomain: FIREBASE_AUTH_DOMAIN,
            projectId: FIREBASE_PROJECT_ID,
            storageBucket: FIREBASE_STORAGE_BUCKET,
            messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
            appId: FIREBASE_APP_ID,
        });
    }

    return app;
}

// Firestore instance with multi-tab offline persistence enabled, so a
// collaborator who loses connectivity keeps reading/writing from the local
// cache and reconciles automatically once back online.
export function getFirestoreDb(): Firestore {
    if (!firestoreDb) {
        firestoreDb = initializeFirestore(getFirebaseApp(), {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
            // Domain objects carry a lot of optional fields (comments,
            // schema, width, ...) that are frequently `undefined` rather
            // than omitted. Firestore rejects `undefined` by default.
            ignoreUndefinedProperties: true,
        });
    }

    return firestoreDb;
}

export function getFirebaseAuthInstance(): Auth {
    if (!firebaseAuth) {
        firebaseAuth = getAuth(getFirebaseApp());
    }

    return firebaseAuth;
}
