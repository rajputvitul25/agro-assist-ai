import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiG4fCIpJikFBVh5BjiIat1rhHWSkRw1c",
  authDomain: "agro-assist-ai-project.firebaseapp.com",
  projectId: "agro-assist-ai-project",
  storageBucket: "agro-assist-ai-project.firebasestorage.app",
  messagingSenderId: "261319280216",
  appId: "1:261319280216:web:3237326fb146476ce8ac2d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);