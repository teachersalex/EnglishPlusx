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

// [v2] Importa do novo sistema de badges
import { 
  BADGE_DEFINITIONS, 
  checkForNewBadge, 
  buildBadgeContext 
} from '../utils/badgeSystem'

// Re-exporta para outros componentes usarem
export { BADGE_DEFINITIONS }

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // ============================================
  // [v2] NOVO SISTEMA DE BADGES - RETORNA STRING OU NULL
  // ============================================
  async function checkAndAwardBadge(additionalContext = {}) {
    if (!user) return null
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentData = userSnap.data() || {}
    const currentBadges = currentData.badges || []
    
    // Constrói contexto completo para verificação
    const badgeContext = buildBadgeContext(currentData, additionalContext)
    
    // Retorna NO MÁXIMO 1 badge (o mais importante)
    const newBadge = checkForNewBadge(badgeContext, currentBadges)
    
    if (newBadge) {
      // Salva no Firebase
      const updatedBadges = [...currentBadges, newBadge]
      await updateDoc(userRef, { badges: updatedBadges })
      
      // Atualiza estado local
      setUserData(prev => ({ ...prev, badges: updatedBadges }))
    }
    
    return newBadge // string ou null
  }

  // Atualizar XP do usuário
  async function updateUserXP(amount) {
    if (!user) return null
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { xp: increment(amount) })
    const newXP = (userData?.xp || 0) + amount
    setUserData(prev => ({ ...prev, xp: newXP }))
    
    // [v2] Retorna no máximo 1 badge
    return await checkAndAwardBadge({ xp: newXP })
  }

  // Atualizar streak diário
  async function updateStreak(overrideUid = null) {
    const uid = overrideUid || user?.uid
    if (!uid) return null
    
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
    let shouldUpdate = false
    
    if (diffDays === null || diffDays > 1) {
      newStreak = 1
      shouldUpdate = true
    } else if (diffDays === 1) {
      newStreak = (data?.streak || 0) + 1
      shouldUpdate = true
    } else if (diffDays === 0 && newStreak === 0) {
      newStreak = 1
      shouldUpdate = true
    }
    
    if (shouldUpdate) {
      await updateDoc(userRef, { 
        streak: newStreak,
        lastActivity: now.toISOString()
      })
      setUserData(prev => ({ ...prev, streak: newStreak, lastActivity: now.toISOString() }))
      
      // [v2] Retorna no máximo 1 badge
      return await checkAndAwardBadge({ streak: newStreak })
    }
    
    return null
  }

  // Salvar progresso do episódio
  async function saveProgress(seriesId, episodeId, data) {
    if (!user) return null
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    
    // Busca progresso atual para não sobrescrever dictationBestScore
    const currentProgress = await getDoc(progressRef)
    const currentData = currentProgress.exists() ? currentProgress.data() : {}
    
    await setDoc(progressRef, {
      seriesId,
      episodeId,
      ...data,
      dictationBestScore: currentData.dictationBestScore || 0,
      lastAccess: new Date().toISOString()
    }, { merge: true })
    
    // [v2] Atualiza contadores se completou
    if (data.completed) {
      await updateCompletionCounters(seriesId, episodeId)
      return await checkAndAwardBadge({ 
        completedEpisode: true, 
        seriesId, 
        episodeId 
      })
    }
    return null
  }

  // [v2] Atualiza contadores de episódios/séries completas
  async function updateCompletionCounters(seriesId, episodeId) {
    if (!user) return
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentData = userSnap.data() || {}
    
    // Conta total de episódios completos
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const progressSnap = await getDocs(progressRef)
    const completedEpisodes = progressSnap.docs.filter(d => d.data().completed === true).length
    
    // Verifica se completou a série
    let totalSeriesCompleted = currentData.totalSeriesCompleted || 0
    try {
      const { seriesData } = await import('../data/series')
      const series = seriesData[seriesId]
      if (series) {
        const seriesProgress = progressSnap.docs
          .filter(d => String(d.data().seriesId) === String(seriesId) && d.data().completed === true)
        
        if (seriesProgress.length >= series.episodes.length) {
          // Checa se já não contamos essa série antes
          const wasAlreadyComplete = (currentData.completedSeriesIds || []).includes(seriesId)
          if (!wasAlreadyComplete) {
            totalSeriesCompleted += 1
            await updateDoc(userRef, {
              completedSeriesIds: [...(currentData.completedSeriesIds || []), seriesId]
            })
          }
        }
      }
    } catch (e) {
      console.error('Erro ao verificar série completa:', e)
    }
    
    await updateDoc(userRef, {
      totalEpisodesCompleted: completedEpisodes,
      totalSeriesCompleted
    })
    
    setUserData(prev => ({
      ...prev,
      totalEpisodesCompleted: completedEpisodes,
      totalSeriesCompleted
    }))
  }

  // [v2] Salvar melhor score do ditado
  async function saveDictationScore(seriesId, episodeId, score) {
    if (!user) return null
    
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    const currentProgress = await getDoc(progressRef)
    const currentData = currentProgress.exists() ? currentProgress.data() : {}
    
    // Só atualiza se for maior que o atual
    const currentBest = currentData.dictationBestScore || 0
    const isNewRecord = score > currentBest
    
    if (isNewRecord) {
      await setDoc(progressRef, {
        seriesId,
        episodeId,
        dictationBestScore: score,
        lastAccess: new Date().toISOString()
      }, { merge: true })
    }
    
    // [v2] Atualiza flags de perfeição e diamante
    const userRef = doc(db, 'users', user.uid)
    const updates = {}
    
    if (score === 100) {
      updates.hasAnyPerfectDictation = true
    }
    
    if (score >= 95) {
      // Verifica se série ganhou diamante
      await updateDiamondCount(seriesId)
    }
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates)
      setUserData(prev => ({ ...prev, ...updates }))
    }
    
    // [v2] Retorna no máximo 1 badge
    return await checkAndAwardBadge({ 
      perfectDictation: score === 100,
      checkDiamond: score >= 95,
      seriesId
    })
  }

  // [v2] Atualiza contador de séries com diamante
  async function updateDiamondCount(seriesId) {
    if (!user) return
    
    try {
      const { seriesData } = await import('../data/series')
      const series = seriesData[seriesId]
      if (!series) return
      
      const hasDiamond = await checkSeriesDiamond(seriesId, series.episodes.length)
      if (!hasDiamond) return
      
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      const currentData = userSnap.data() || {}
      
      // Verifica se já contamos esse diamante
      const diamondSeriesIds = currentData.diamondSeriesIds || []
      if (diamondSeriesIds.includes(seriesId)) return
      
      const newDiamondSeriesIds = [...diamondSeriesIds, seriesId]
      await updateDoc(userRef, {
        diamondSeriesIds: newDiamondSeriesIds,
        seriesWithDiamond: newDiamondSeriesIds.length
      })
      
      setUserData(prev => ({
        ...prev,
        diamondSeriesIds: newDiamondSeriesIds,
        seriesWithDiamond: newDiamondSeriesIds.length
      }))
    } catch (e) {
      console.error('Erro ao atualizar diamantes:', e)
    }
  }

  // Buscar progresso completo de uma série
  async function getSeriesProgress(seriesId) {
    if (!user) return []
    
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const snap = await getDocs(progressRef)
    
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => String(p.seriesId) === String(seriesId))
  }

  // Verifica se série tem diamante
  async function checkSeriesDiamond(seriesId, totalEpisodes) {
    if (!user) return false
    
    const progress = await getSeriesProgress(seriesId)
    const completedEpisodes = progress.filter(p => p.completed === true)
    if (completedEpisodes.length < totalEpisodes) return false
    
    return completedEpisodes.every(p => (p.dictationBestScore || 0) >= 95)
  }

  // Buscar todas as séries com diamante
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

  // Pegar último episódio acessado
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
        // [v2] Novos campos para o sistema de badges
        totalEpisodesCompleted: 0,
        totalSeriesCompleted: 0,
        seriesWithDiamond: 0,
        hasAnyPerfectDictation: false,
        completedSeriesIds: [],
        diamondSeriesIds: [],
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
    // Gamification
    saveDictationScore,
    getSeriesProgress,
    checkSeriesDiamond,
    getDiamondSeries,
    getUserBadges,
    checkAndAwardBadge, // [v2] Singular agora
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}