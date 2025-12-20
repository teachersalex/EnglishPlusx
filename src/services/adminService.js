import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { firebaseConfig } from './firebase' // Certifique-se de importar sua config correta

// Inicializa uma instância SECUNDÁRIA do Firebase
// Isso permite criar usuários sem deslogar o Admin da instância principal
const secondaryApp = initializeApp(firebaseConfig, "Secondary")
const secondaryAuth = getAuth(secondaryApp)
const db = getFirestore(secondaryApp) // O banco é o mesmo, só a auth que separa

export async function createStudentAccount(email, password, name) {
  try {
    // 1. Cria a Auth (Email/Senha) na instância secundária
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const user = userCredential.user

    // 2. Cria o documento no Firestore (Dados públicos do user)
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      createdAt: serverTimestamp(),
      xp: 0,
      streak: 0,
      role: 'student', // Marcamos como aluno
      lastActivity: serverTimestamp()
    })

    // 3. Desloga da instância secundária para limpar a memória
    await signOut(secondaryAuth)

    return { success: true, uid: user.uid }
  } catch (error) {
    console.error("Erro ao criar aluno:", error)
    throw error
  }
}