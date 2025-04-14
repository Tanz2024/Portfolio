// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuWLS8wXIXipzfcmiQxMXxOhXeD4UtAzE",
  authDomain: "tanzimportfolio.firebaseapp.com",
  projectId: "tanzimportfolio",
  storageBucket: "tanzimportfolio.appspot.com", // fix typo here
  messagingSenderId: "428868166100",
  appId: "1:428868166100:web:90c574926a64c541147641",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
