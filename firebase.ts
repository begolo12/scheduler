import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3cvF-8_xfwCogL-H7bFTnY6pF3kPSk-M",
  authDomain: "aplikasi-schedule.firebaseapp.com",
  projectId: "aplikasi-schedule",
  storageBucket: "aplikasi-schedule.firebasestorage.app",
  messagingSenderId: "668191930638",
  appId: "1:668191930638:web:b5032679c657d938a3ff5f",
  measurementId: "G-68KBZDDT8L"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const db = app.firestore();

// Helper functions to mimic Modular SDK using Compat SDK
const collection = (firestore: any, path: string) => firestore.collection(path);
const onSnapshot = (ref: any, next: any, error?: any) => ref.onSnapshot(next, error);
const addDoc = (ref: any, data: any) => ref.add(data);
const setDoc = (ref: any, data: any) => ref.set(data);
const updateDoc = (ref: any, data: any) => ref.update(data);
const deleteDoc = (ref: any) => ref.delete();
const doc = (firestore: any, path: string, id: string) => firestore.collection(path).doc(id);
const getDoc = (ref: any) => ref.get(); // Add getDoc
const arrayUnion = (element: any) => firebase.firestore.FieldValue.arrayUnion(element); // Add arrayUnion
const Timestamp = firebase.firestore.Timestamp;

// Export Firestore functions required by App.tsx
export { 
  db, 
  collection, 
  onSnapshot, 
  addDoc,
  setDoc,
  updateDoc, 
  doc, 
  deleteDoc, 
  getDoc,
  arrayUnion,
  Timestamp 
};