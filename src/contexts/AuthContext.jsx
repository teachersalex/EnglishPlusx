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

// ============================================
// BADGES DEFINITIONS
// ============================================
const BADGE_DEFINITIONS = {
  first_steps: {
    id: 'first_steps',
    name: 'First Steps',
    icon: '🔥',
    description: 'Completou seu primeiro episódio'
  },
  bookworm: {
    id: 'bookworm',
    name: 'Bookworm',
    icon: '📚',
    description: 'Completou sua primeira série'
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    icon: '💎',
    description: 'Conseguiu seu primeiro diamante'
  },
  diamond_master: {
    id: 'diamond_master',
    name: 'Diamond Master',
    icon: '👑',
    description: '3 séries com diamante'
  },
  sharp_ear: {
    id: 'sharp_ear',
    name: 'Sharp Ear',
    icon: '🎯',
    description: '100% em um ditado'
  },
  dedicated: {
    id: 'dedicated',
    name: 'Dedicated',
    icon: '📝',
    description: '7 dias seguidos'
  },
  rising_star: {
    id: 'rising_star',
    name: 'Rising Star',
    icon: '🚀',
    description: '500 XP total'
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    icon: '⭐',
    description: '1000 XP total'
  }
}

export { BADGE_DEFINITIONS }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Atualizar XP do usuário
  async function updateUserXP(amount) {
    if (!user) return []
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { xp: increment(amount) })
    const newXP = (userData?.xp || 0) + amount
    setUserData(prev => ({ ...prev, xp: newXP }))
    
    // Verifica badges de XP e retorna os novos
    const newBadges = await checkAndAwardBadges({ xp: newXP })
    return newBadges || []
  }

  // Atualizar streak diário
  async function updateStreak(overrideUid = null) {
    const uid = overrideUid || user?.uid
    if (!uid) return []
    
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    const data = userSnap.data()
    
    const lastActivity = data?.lastActivity ? new Date(data.lastActivity) : null
    const now = new Date()
    
    // Normaliza para comparar só a data (ignora hora)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastDay = lastActivity 
      ? new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
      : null
    
    // Calcula diferença em dias
    const diffDays = lastDay 
      ? Math.floor((today - lastDay) / (1000 * 60 * 60 * 24))
      : null
    
    let newStreak = data?.streak || 0
    let badgesAwarded = []
    let shouldUpdate = false
    
    if (diffDays === null || diffDays > 1) {
      // Primeiro acesso ou pulou mais de 1 dia → reseta
      newStreak = 1
      shouldUpdate = true
    } else if (diffDays === 1) {
      // Dia consecutivo → incrementa
      newStreak = (data?.streak || 0) + 1
      shouldUpdate = true
    } else if (diffDays === 0 && newStreak === 0) {
      // Mesmo dia mas streak é 0 (primeiro login real) → inicia
      newStreak = 1
      shouldUpdate = true
    }
    // Se diffDays === 0 e streak > 0, mantém
    
    if (shouldUpdate) {
      await updateDoc(userRef, { 
        streak: newStreak,
        lastActivity: now.toISOString()
      })
      setUserData(prev => ({ ...prev, streak: newStreak, lastActivity: now.toISOString() }))
      
      // Verifica badge de dedicação
      if (newStreak >= 7) {
        badgesAwarded = await checkAndAwardBadges({ streak: newStreak })
      }
    }
    
    return badgesAwarded || []
  }

  // Salvar progresso do episódio
  async function saveProgress(seriesId, episodeId, data) {
    if (!user) return []
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    
    // Busca progresso atual para não sobrescrever dictationBestScore
    const currentProgress = await getDoc(progressRef)
    const currentData = currentProgress.exists() ? currentProgress.data() : {}
    
    await setDoc(progressRef, {
      seriesId,
      episodeId,
      ...data,
      // Preserva dictationBestScore se já existir
      dictationBestScore: currentData.dictationBestScore || 0,
      lastAccess: new Date().toISOString()
    }, { merge: true })
    
    // Verifica badges se completou e retorna os novos
    if (data.completed) {
      const newBadges = await checkAndAwardBadges({ completedEpisode: true, seriesId, episodeId })
      return newBadges || []
    }
    return []
  }

  // [v10.4] Salvar melhor score do ditado
  async function saveDictationScore(seriesId, episodeId, score) {
    if (!user) return
    
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    const currentProgress = await getDoc(progressRef)
    const currentData = currentProgress.exists() ? currentProgress.data() : {}
    
    // Só atualiza se for maior que o atual
    const currentBest = currentData.dictationBestScore || 0
    if (score > currentBest) {
      await setDoc(progressRef, {
        seriesId,
        episodeId,
        dictationBestScore: score,
        lastAccess: new Date().toISOString()
      }, { merge: true })
    }
    
    // Verifica badges e coleta todos os novos
    let allNewBadges = []
    
    if (score === 100) {
      const newBadges = await checkAndAwardBadges({ perfectDictation: true })
      if (newBadges?.length) allNewBadges.push(...newBadges)
    }
    if (score >= 95) {
      const newBadges = await checkAndAwardBadges({ checkDiamond: true, seriesId })
      if (newBadges?.length) allNewBadges.push(...newBadges)
    }
    
    return allNewBadges // Retorna badges conquistados para celebração
  }

  // [v10.4] Buscar progresso completo de uma série (para calcular diamante)
  async function getSeriesProgress(seriesId) {
    if (!user) return []
    
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const snap = await getDocs(progressRef)
    
    // Filtra pelo seriesId
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => String(p.seriesId) === String(seriesId))
  }

  // [v10.4] Verifica se série tem diamante
  async function checkSeriesDiamond(seriesId, totalEpisodes) {
    if (!user) return false
    
    const progress = await getSeriesProgress(seriesId)
    
    // Precisa ter todos os episódios completos
    const completedEpisodes = progress.filter(p => p.completed === true)
    if (completedEpisodes.length < totalEpisodes) return false
    
    // Todos precisam ter dictationBestScore >= 95
    return completedEpisodes.every(p => (p.dictationBestScore || 0) >= 95)
  }

  // [v10.4] Buscar todas as séries com diamante
  async function getDiamondSeries(seriesData) {
    if (!user) return {}
    
    const diamonds = {}
    
    for (const [seriesId, series] of Object.entries(seriesData)) {
      const hasDiamond = await checkSeriesDiamond(seriesId, series.episodes.length)
      diamonds[seriesId] = hasDiamond
    }
    
    return diamonds
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
  // TRANSCRIÇÕES
  // ============================================
  async function saveTranscription(data) {
    if (!user) return
    
    const docId = `${data.seriesId}_${data.episodeId}_${Date.now()}`
    const transcriptionRef = doc(db, 'users', user.uid, 'transcriptions', docId)
    
    await setDoc(transcriptionRef, {
      ...data,
      savedAt: new Date().toISOString()
    })
  }

  async function getTranscriptions(seriesId, episodeId) {
    if (!user) return []
    
    const transcriptionsRef = collection(db, 'users', user.uid, 'transcriptions')
    const q = query(transcriptionsRef, orderBy('timestamp', 'desc'))
    const snap = await getDocs(q)
    
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => t.seriesId === seriesId && t.episodeId === episodeId)
  }

  // ============================================
  // BADGES SYSTEM
  // ============================================
  async function checkAndAwardBadges(context = {}) {
    if (!user) return
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentBadges = userSnap.data()?.badges || []
    const newBadges = [...currentBadges]
    
    // First Steps - completou primeiro episódio
    if (context.completedEpisode && !currentBadges.includes('first_steps')) {
      newBadges.push('first_steps')
    }
    
    // Sharp Ear - 100% em ditado
    if (context.perfectDictation && !currentBadges.includes('sharp_ear')) {
      newBadges.push('sharp_ear')
    }
    
    // Rising Star - 500 XP
    if (context.xp >= 500 && !currentBadges.includes('rising_star')) {
      newBadges.push('rising_star')
    }
    
    // Expert - 1000 XP
    if (context.xp >= 1000 && !currentBadges.includes('expert')) {
      newBadges.push('expert')
    }
    
    // Dedicated - 7 dias streak
    const currentStreak = context.streak || userSnap.data()?.streak || 0
    if (currentStreak >= 7 && !currentBadges.includes('dedicated')) {
      newBadges.push('dedicated')
    }
    
    // Bookworm - completou primeira série
    if (context.completedEpisode && context.seriesId && !currentBadges.includes('bookworm')) {
      try {
        const { seriesData } = await import('../data/series')
        const series = seriesData[context.seriesId]
        if (series) {
          const seriesProgress = await getSeriesProgress(context.seriesId)
          if (seriesProgress.filter(p => p.completed).length >= series.episodes.length) {
            newBadges.push('bookworm')
          }
        }
      } catch (e) {
        console.error('Erro ao verificar bookworm:', e)
      }
    }
    
    // Perfectionist - primeiro diamante
    if (context.checkDiamond && context.seriesId && !currentBadges.includes('perfectionist')) {
      try {
        const { seriesData } = await import('../data/series')
        const series = seriesData[context.seriesId]
        if (series) {
          const hasDiamond = await checkSeriesDiamond(context.seriesId, series.episodes.length)
          if (hasDiamond) {
            newBadges.push('perfectionist')
          }
        }
      } catch (e) {
        console.error('Erro ao verificar perfectionist:', e)
      }
    }
    
    // Diamond Master - 3 séries com diamante
    if (context.checkDiamond && !currentBadges.includes('diamond_master')) {
      try {
        const { seriesData } = await import('../data/series')
        const diamonds = await getDiamondSeries(seriesData)
        const diamondCount = Object.values(diamonds).filter(Boolean).length
        if (diamondCount >= 3) {
          newBadges.push('diamond_master')
        }
      } catch (e) {
        console.error('Erro ao verificar diamond_master:', e)
      }
    }
    
    // Identifica badges NOVOS (para celebração)
    const awardedNow = newBadges.filter(b => !currentBadges.includes(b))
    
    // Salva se tiver novos badges
    if (awardedNow.length > 0) {
      await updateDoc(userRef, { badges: newBadges })
      setUserData(prev => ({ ...prev, badges: newBadges }))
    }
    
    return awardedNow // Retorna array de badges recém-conquistados
  }

  async function getUserBadges() {
    if (!user) return []
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    return userSnap.data()?.badges || []
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
        badges: [],
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
        
        // Atualiza streak no login
        await updateStreak(user.uid)
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
    updateStreak,
    saveProgress,
    getProgress,
    getLastProgress,
    saveTranscription,
    getTranscriptions,
    // [v10.4] Gamification
    saveDictationScore,
    getSeriesProgress,
    checkSeriesDiamond,
    getDiamondSeries,
    getUserBadges,
    checkAndAwardBadges,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}