import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
// Importamos a configuração que você já tem no seu firebase.js
// ATENÇÃO: Certifique-se de que o seu arquivo firebase.js está exportando "firebaseConfig"
import { firebaseConfig } from './firebase' 

// Aqui acontece a mágica: Inicializamos uma "Segunda Instância" do App.
// É como abrir uma aba anônima só para criar o usuário.
const secondaryApp = initializeApp(firebaseConfig, "Secondary")
const secondaryAuth = getAuth(secondaryApp)
const db = getFirestore(secondaryApp)

export async function createStudentAccount(email, password, name) {
  try {
    // 1. Cria o login e senha nessa instância secundária
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const user = userCredential.user

    // 2. Salva os dados do aluno (Nome, XP inicial) no banco de dados
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      createdAt: serverTimestamp(),
      xp: 0,
      streak: 0,
      role: 'student', // Marcamos ele como aluno
      lastActivity: serverTimestamp()
    })

    // 3. Desloga da instância secundária para limpar a memória
    // (Sua conta principal continua logada intacta!)
    await signOut(secondaryAuth)

    return { success: true, uid: user.uid }
  } catch (error) {
    console.error("Erro ao criar aluno:", error)
    throw error // Joga o erro pra gente mostrar na tela se der ruim
  }
}