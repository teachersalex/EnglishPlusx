import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../services/firebase'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Atualizar XP do usuário
  async function updateUserXP(amount) {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { xp: increment(amount) })
    setUserData(prev => ({ ...prev, xp: (prev?.xp || 0) + amount }))
  }

  // Salvar progresso do episódio
  async function saveProgress(seriesId, episodeId, data) {
    if (!user) return
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    await setDoc(progressRef, {
      seriesId,
      episodeId,
      ...data,
      lastAccess: new Date().toISOString()
    }, { merge: true })
  }

  // Carregar progresso de um episódio específico
  async function getProgress(seriesId, episodeId) {
    if (!user) return null
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    const snap = await getDoc(progressRef)
    return snap.exists() ? snap.data() : null
  }

  // Pegar último episódio acessado (para "Continue ouvindo")
  async function getLastProgress() {
    if (!user) return null
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const q = query(progressRef, orderBy('lastAccess', 'desc'), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].data()
  }

  // ============================================
  // [v10.3] SALVAR TRANSCRIÇÃO DO DITADO
  // Auto-save quando aluno clica "Verificar"
  // ============================================
  async function saveTranscription(data) {
    if (!user) return
    
    // Gera ID único: seriesId_episodeId_timestamp
    const docId = `${data.seriesId}_${data.episodeId}_${Date.now()}`
    const transcriptionRef = doc(db, 'users', user.uid, 'transcriptions', docId)
    
    await setDoc(transcriptionRef, {
      ...data,
      odAt: new Date().toISOString()
    })
  }

  // [v10.3] Buscar histórico de transcrições de um episódio
  async function getTranscriptions(seriesId, episodeId) {
    if (!user) return []
    
    const transcriptionsRef = collection(db, 'users', user.uid, 'transcriptions')
    const q = query(transcriptionsRef, orderBy('timestamp', 'desc'))
    const snap = await getDocs(q)
    
    // Filtra pelo episódio específico
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => t.seriesId === seriesId && t.episodeId === episodeId)
  }

  // Cria ou atualiza dados do usuário no Firestore
  async function createUserData(uid, email, name) {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const newUserData = {
        email,
        name: name || email.split('@')[0],
        xp: 0,
        streak: 0,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      await setDoc(userRef, newUserData)
      return newUserData
    } else {
      return userSnap.data()
    }
  }

  // Login com email/senha
  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const data = await createUserData(result.user.uid, result.user.email)
    setUserData(data)
    return result
  }

  // Cadastro com email/senha
  async function signup(email, password, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const data = await createUserData(result.user.uid, result.user.email, name)
    setUserData(data)
    return result
  }

  // Login com Google
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const data = await createUserData(result.user.uid, result.user.email, result.user.displayName)
    setUserData(data)
    return result
  }

  // Logout
  async function logout() {
    await signOut(auth)
    setUserData(null)
  }

  // Observa mudanças no auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const data = await createUserData(user.uid, user.email, user.displayName)
        setUserData(data)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    userData,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUserXP,
    saveProgress,
    getProgress,
    getLastProgress,
    saveTranscription,      // [v10.3] Nova função
    getTranscriptions,      // [v10.3] Nova função
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}