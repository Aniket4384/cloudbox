// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "cloud-app-cc93a.firebaseapp.com",
  projectId: "cloud-app-cc93a",
  storageBucket: "cloud-app-cc93a.firebasestorage.app",
  messagingSenderId: "262717251602",
  appId: "1:262717251602:web:948d27698b0b94a19378cb",
  measurementId: "G-WGTKCF6WY5"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


const auth = getAuth(app)

export {app,auth}