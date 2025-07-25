import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where,onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwWzwemKSXfByKDHhUKsqMe7qTOga1t8",
  authDomain: "testproject-d9e34.firebaseapp.com",
  databaseURL: "https://testproject-d9e34-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "testproject-d9e34",
  storageBucket: "testproject-d9e34.appspot.com",
  messagingSenderId: "11095651475",
  appId: "1:11095651475:web:15541b8d232e33a446c966",
  measurementId: "G-C93LGFEQKM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Reference your collection (e.g. 'items')
const collectionRef = collection(db, "items");

export { app, db };  // export db here so you can import it elsewhere if needed

// Create - Add a new document
export async function addItem(data) {
  try {
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Real-time listener for comments filtered by articleId
export function subscribeToComments(articleId, callback) {
  const q = query(collectionRef, where("articleId", "==", articleId));
  
  // onSnapshot returns an unsubscribe function
  return onSnapshot(q, (snapshot) => {
    const comments = [];
    snapshot.forEach(doc => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    callback(comments);  // pass updated comments to your callback
  });
}

// Update - Update a document by ID
export async function updateItem(id, updatedData) {
  try {
    const docRef = doc(db, "items", id);
    await updateDoc(docRef, updatedData);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

// Delete - Delete a document by ID
export async function deleteItem(id) {
  try {
    const docRef = doc(db, "items", id);
    await deleteDoc(docRef);
  } catch (e) {
    console.error("Error deleting document: ", e);
  }
}
