import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALyRltvavL2fychuHXxx-fbIabDIXzbrk",
  authDomain: "inventory-forecasting-64a3e.firebaseapp.com",
  projectId: "inventory-forecasting-64a3e",
  storageBucket: "inventory-forecasting-64a3e.firebasestorage.app",
  messagingSenderId: "603820730531",
  appId: "1:603820730531:web:40ce8d676fefb8c444f716"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
