// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: 'AIzaSyAc7xzH2DsoSRRMrKuz47CHedwmFY7cM9U',
  authDomain: 'thesaboteur.firebaseapp.com',
  projectId: 'thesaboteur',
  storageBucket: 'thesaboteur.appspot.com',
  messagingSenderId: '35833465655',
  appId: '1:35833465655:web:f7e6015f41764bbfad28b2',
  measurementId: 'G-5JDPJK83YZ',
  databaseURL: 'https://thesaboteur-default-rtdb.asia-southeast1.firebasedatabase.app/',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const realtime = getDatabase(app);
export const storage = getStorage(app);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8081);
  connectDatabaseEmulator(realtime, 'localhost', 9000);
  connectStorageEmulator(storage, 'localhost', 9199);
}
