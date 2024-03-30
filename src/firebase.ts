// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAc7xzH2DsoSRRMrKuz47CHedwmFY7cM9U',
  authDomain: 'thesaboteur.firebaseapp.com',
  projectId: 'thesaboteur',
  storageBucket: 'thesaboteur.appspot.com',
  messagingSenderId: '35833465655',
  appId: '1:35833465655:web:f7e6015f41764bbfad28b2',
  measurementId: 'G-5JDPJK83YZ',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

connectFirestoreEmulator(db, 'localhost', 8080);
