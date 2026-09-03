// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import type { Chat, Message } from "./types";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAzOMSDXg3TRb9MRfKJxLp4mDk-Q5-zIdY",
  authDomain: "whats-cad.firebaseapp.com",
  projectId: "whats-cad",
  storageBucket: "whats-cad.firebasestorage.app",
  messagingSenderId: "153886856889",
  appId: "1:153886856889:web:e2c95f4364cca561f96d68"
};

// Initialize Firebase app singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

/**
 * Helper to save or update a chat document in Firestore
 */
export async function saveChatToFirestore(chat: Chat): Promise<void> {
  try {
    const chatRef = doc(db, "chats", chat.id);
    await setDoc(chatRef, {
      ...chat,
      syncedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn("Firestore sync warning (chats):", error);
  }
}

/**
 * Helper to save a message in Firestore
 */
export async function saveMessageToFirestore(message: Message): Promise<void> {
  try {
    const msgRef = doc(db, "chats", message.chatId, "messages", message.id);
    await setDoc(msgRef, {
      ...message,
      syncedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn("Firestore sync warning (messages):", error);
  }
}

export default app;
