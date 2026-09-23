// Firebase: the drop-off point between the guests' phones and the kitchen iPad.
// Shares the Foos project; orders live under leagues/<event>/orders, which the
// existing rules already allow for (invisible) anonymous sign-ins.
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

// ?event=test points everything at a scratch event so testing never touches
// the real lunch.
export const EVENT = new URLSearchParams(location.search).get('event') || 'book-club-lunch-2026-09-26';

export async function connect() {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const app = initializeApp({
    apiKey: 'AIzaSyC2bOtXmNLzwJy3QsDkk1tQRBD_wMdhzcM',
    authDomain: 'foos-6ecf3.firebaseapp.com',
    projectId: 'foos-6ecf3',
    storageBucket: 'foos-6ecf3.firebasestorage.app',
    messagingSenderId: '730132593509',
    appId: '1:730132593509:web:6379dde4e6a92be09d7f8c',
  });
  await auth.signInAnonymously(auth.getAuth(app));
  const db = fs.getFirestore(app);
  return { fs, orders: fs.collection(db, 'leagues', EVENT, 'orders') };
}
