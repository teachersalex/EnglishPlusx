import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCTvdoA1xxu4ZCwB01fX3oQFXyrqilBzik",
  authDomain: "englishplus-7506c.firebaseapp.com",
  projectId: "englishplus-7506c",
  storageBucket: "englishplus-7506c.firebasestorage.app",
  messagingSenderId: "672413534914",
  appId: "1:672413534914:web:90e96064eeb86ee3cfc95b"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)