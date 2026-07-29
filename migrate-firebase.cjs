const { initializeApp } = require('firebase/app');
const {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    query,
    limit: firestoreLimit,
    connectFirestoreEmulator,
} = require('firebase/firestore');
const {
    getAuth,
    signInAnonymously,
    connectAuthEmulator,
} = require('firebase/auth');
const admin = require('firebase-admin');
const { getFirestore: getAdminFirestore } = require('firebase-admin/firestore');

const path = require('path');

// ─── Convert Timestamps to plain Date objects ───────────────────────────
function convertTimestamps(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj?.toDate === 'function') {
        return obj.toDate();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
        const result = {};
        for (const [key, val] of Object.entries(obj)) {
            result[key] = convertTimestamps(val);
        }
        return result;
    }
    return obj;
}

// ─── Old Firebase project (qyyqiq) – client SDK ──────────────────────────
const OLD_CONFIG = {
    apiKey: 'AIzaSyC-NT80X5Z7tmQpkKmcQNr3FTPFYF8jeek',
    authDomain: 'qyyqiq.firebaseapp.com',
    projectId: 'qyyqiq',
    storageBucket: 'qyyqiq.firebasestorage.app',
    messagingSenderId: '451263322571',
    appId: '1:451263322571:web:176303ba20c8f4be32be4e',
};

const COLLECTIONS = [
    'diagrams',
    'db_tables',
    'db_relationships',
    'db_dependencies',
    'areas',
    'db_custom_types',
    'notes',
    'diagram_filters',
];

async function migrate() {
    // ── Init old Firebase (client SDK) ─────────────────────────────────
    console.log('Initializing old Firebase project (qyyqiq)...');
    const oldApp = initializeApp(OLD_CONFIG, 'old');
    const oldAuth = getAuth(oldApp);
    const oldDb = getFirestore(oldApp);

    console.log('Signing in anonymously to old project...');
    await signInAnonymously(oldAuth);
    console.log('Signed in. User:', oldAuth.currentUser?.uid);

    // ── Read all data from old Firestore ────────────────────────────────
    const allData = {};
    for (const colName of COLLECTIONS) {
        console.log(`Reading collection: ${colName}...`);
        const colRef = collection(oldDb, colName);
        const snapshot = await getDocs(colRef);
        const docs = [];
        snapshot.forEach((d) => {
            docs.push({ id: d.id, data: d.data() });
        });
        allData[colName] = docs;
        console.log(`  → ${docs.length} documents`);
    }

    console.log('\n--- Migration Summary ---');
    for (const [col, docs] of Object.entries(allData)) {
        console.log(`${col}: ${docs.length} documents`);
    }

    // ── Init new Firebase (Admin SDK) ──────────────────────────────────
    console.log('\nInitializing new Firebase project (rome2rio-dax-dev)...');
    const serviceAccount = require(path.resolve(
        __dirname,
        'firebase-migration-key.json'
    ));
    const newApp = admin.initializeApp({
        credential: admin.cert(serviceAccount),
    });
    const newDb = getAdminFirestore(newApp, 'chartdb');

    // ── Write all data to new Firestore ────────────────────────────────
    for (const colName of COLLECTIONS) {
        const docs = allData[colName];
        if (docs.length === 0) {
            console.log(`Skipping ${colName} (empty)`);
            continue;
        }
        console.log(`Writing ${docs.length} docs to ${colName}...`);
        const batch = newDb.batch();
        for (const docData of docs) {
            const docRef = newDb.collection(colName).doc(docData.id);
            batch.set(docRef, convertTimestamps(docData.data));
        }
        await batch.commit();
        console.log(`  ✓ ${colName} written`);
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
