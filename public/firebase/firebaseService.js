
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwWzwemKSXfByKDHhUKsqMe7YqTOga1t8",
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

export { app };

// Create - Add a new document
export async function addItem(data) {
  try {
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Read - Get all documents
export async function getItems(articleId) {
  try {
    // Create query filtering by articleId field
    const q = query(collectionRef, where("articleId", "==", articleId));
    
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (e) {
    console.error("Error getting documents: ", e);
  }
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

