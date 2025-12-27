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

import { 
  BADGE_DEFINITIONS,
  checkSeriesCompletionBadge,
  checkDictationBadge,
  checkQuizBadge,
  buildBadgeContext 
} from '../utils/badgeSystem'

export { BADGE_DEFINITIONS }

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

// === TUTORIAL ID (não conta para badges/diamantes) ===
const TUTORIAL_SERIES_ID = 0

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // ============================================
  // SISTEMA DE BADGES v11
  // ============================================
  
  /**
   * Verifica badge ao completar SÉRIE
   * Retorna no máximo 1 badge (prioridade: diamante > volume)
   */
  async function checkSeriesBadge() {
    if (!user) return null
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentData = userSnap.data() || {}
    const currentBadges = currentData.badges || []
    
    const context = buildBadgeContext(currentData)
    const newBadge = checkSeriesCompletionBadge(context, currentBadges)
    
    if (newBadge) {
      const updatedBadges = [...currentBadges, newBadge]
      await updateDoc(userRef, { badges: updatedBadges })
      setUserData(prev => ({ ...prev, badges: updatedBadges }))
    }
    
    return newBadge
  }

  /**
   * Verifica badge ao fazer DITADO 100%
   */
  async function checkDictationPerfectBadge() {
    if (!user) return null
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentData = userSnap.data() || {}
    const currentBadges = currentData.badges || []
    
    const context = buildBadgeContext(currentData)
    const newBadge = checkDictationBadge(context, currentBadges)
    
    if (newBadge) {
      const updatedBadges = [...currentBadges, newBadge]
      await updateDoc(userRef, { badges: updatedBadges })
      setUserData(prev => ({ ...prev, badges: updatedBadges }))
    }
    
    return newBadge
  }

  /**
   * Verifica badge ao completar QUIZ 100%
   */
  async function checkQuizPerfectBadge() {
    if (!user) return null
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentData = userSnap.data() || {}
    const currentBadges = currentData.badges || []
    
    const context = buildBadgeContext(currentData)
    const newBadge = checkQuizBadge(context, currentBadges)
    
    if (newBadge) {
      const updatedBadges = [...currentBadges, newBadge]
      await updateDoc(userRef, { badges: updatedBadges })
      setUserData(prev => ({ ...prev, badges: updatedBadges }))
    }
    
    return newBadge
  }

  // ============================================
  // XP E STREAK
  // ============================================
  
  async function updateUserXP(amount) {
    if (!user) return null
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { xp: increment(amount) })
    const newXP = (userData?.xp || 0) + amount
    setUserData(prev => ({ ...prev, xp: newXP }))
    return null // XP não dá badge diretamente
  }

  async function updateStreak(overrideUid = null) {
    const uid = overrideUid || user?.uid
    if (!uid) return null
    
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    const data = userSnap.data()
    
    const lastActivity = data?.lastActivity ? new Date(data.lastActivity) : null
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastDay = lastActivity 
      ? new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
      : null
    
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
    }
    return null // Streak não dá badge diretamente
  }

  // ============================================
  // SAVE PROGRESS (com verificação de série)
  // ============================================
  async function saveProgress(seriesId, episodeId, data) {
    if (!user) return null
    
    // Converte para número para consistência
    const numericSeriesId = parseInt(seriesId, 10)
    const numericEpisodeId = parseInt(episodeId, 10)
    
    const progressRef = doc(db, 'users', user.uid, 'progress', `${numericSeriesId}_${numericEpisodeId}`)
    
    const currentProgress = await getDoc(progressRef)
    const currentData = currentProgress.exists() ? currentProgress.data() : {}
    
    await setDoc(progressRef, {
      seriesId: numericSeriesId,
      episodeId: numericEpisodeId,
      ...data,
      dictationBestScore: currentData.dictationBestScore || 0,
      lastAccess: new Date().toISOString()
    }, { merge: true })
    
    if (data.completed) {
      await updateCompletionCounters(numericSeriesId, numericEpisodeId)
      
      // === TUTORIAL NÃO CONTA PARA DIAMANTE ===
      if (numericSeriesId === TUTORIAL_SERIES_ID) {
        return null // Tutorial não dá badge
      }
      
      // Verifica se ganhou diamante e atualiza contador
      const isDiamond = await updateDiamondCount(numericSeriesId)
      
      // Verifica badge de conclusão de série
      const seriesBadge = await checkSeriesBadge()
      
      return seriesBadge
    }
    return null
  }

  async function updateCompletionCounters(seriesId, episodeId) {
    if (!user) return
    
    // Converte para número
    const numericSeriesId = parseInt(seriesId, 10)
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentData = userSnap.data() || {}
    
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const progressSnap = await getDocs(progressRef)
    
    // Conta episódios completos (excluindo tutorial)
    const completedEpisodes = progressSnap.docs.filter(d => {
      const data = d.data()
      return data.completed === true && parseInt(data.seriesId, 10) !== TUTORIAL_SERIES_ID
    }).length
    
    let totalSeriesCompleted = currentData.totalSeriesCompleted || 0
    
    try {
      const { seriesData } = await import('../data/series')
      const series = seriesData[numericSeriesId]
      
      if (series) {
        const seriesProgress = progressSnap.docs
          .filter(d => parseInt(d.data().seriesId, 10) === numericSeriesId && d.data().completed === true)
        
        if (seriesProgress.length >= series.episodes.length) {
          // Checa se já está em completedSeriesIds (como número)
          const completedIds = (currentData.completedSeriesIds || []).map(id => parseInt(id, 10))
          const wasAlreadyComplete = completedIds.includes(numericSeriesId)
          
          if (!wasAlreadyComplete) {
            // Adiciona à lista de completos
            const newCompletedIds = [...completedIds, numericSeriesId]
            
            await updateDoc(userRef, {
              completedSeriesIds: newCompletedIds
            })
            
            // Atualiza state local imediatamente
            setUserData(prev => ({
              ...prev,
              completedSeriesIds: newCompletedIds
            }))
            
            // Só incrementa contador se NÃO for tutorial
            if (numericSeriesId !== TUTORIAL_SERIES_ID) {
              totalSeriesCompleted += 1
            }
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

  // ============================================
  // SAVE DICTATION SCORE
  // ============================================
  async function saveDictationScore(seriesId, episodeId, score) {
    if (!user) return null
    
    // Converte para número
    const numericSeriesId = parseInt(seriesId, 10)
    const numericEpisodeId = parseInt(episodeId, 10)
    
    const progressRef = doc(db, 'users', user.uid, 'progress', `${numericSeriesId}_${numericEpisodeId}`)
    const currentProgress = await getDoc(progressRef)
    const currentBestScore = currentProgress.exists() ? (currentProgress.data().dictationBestScore || 0) : 0
    
    // Só atualiza se for melhor
    if (score > currentBestScore) {
      // HOTFIX: setDoc merge cria o doc se não existir (updateDoc crashava)
      await setDoc(progressRef, { 
        seriesId: numericSeriesId,
        episodeId: numericEpisodeId,
        dictationBestScore: score,
        lastAccess: new Date().toISOString()
      }, { merge: true })
    }
    
    // === TUTORIAL NÃO CONTA PARA BADGES ===
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return null
    }
    
    // Se score 100 e é a primeira vez com 100
    if (score === 100 && currentBestScore < 100) {
      const userRef = doc(db, 'users', user.uid)
      // HOTFIX: setDoc merge é mais seguro
      await setDoc(userRef, { 
        perfectDictationCount: increment(1)
      }, { merge: true })
      
      const newCount = (userData?.perfectDictationCount || 0) + 1
      setUserData(prev => ({ 
        ...prev, 
        perfectDictationCount: newCount
      }))
      
      // Verifica badge de ditado
      return await checkDictationPerfectBadge()
    }
    
    return null
  }

  // ============================================
  // SAVE QUIZ SCORE
  // ============================================
  async function saveQuizScore(seriesId, episodeId, score, totalQuestions) {
    if (!user) return null
    
    // Converte para número
    const numericSeriesId = parseInt(seriesId, 10)
    
    // === TUTORIAL NÃO CONTA PARA BADGES ===
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return null
    }
    
    const isPerfect = score === totalQuestions
    
    if (isPerfect) {
      const userRef = doc(db, 'users', user.uid)
      // HOTFIX: setDoc merge é mais seguro
      await setDoc(userRef, { 
        perfectQuizCount: increment(1)
      }, { merge: true })
      
      const newCount = (userData?.perfectQuizCount || 0) + 1
      setUserData(prev => ({ 
        ...prev, 
        perfectQuizCount: newCount
      }))
      
      // Verifica badge de quiz (Quiz Master)
      return await checkQuizPerfectBadge()
    }
    
    return null
  }

  // ============================================
  // DIAMOND COUNT
  // ============================================
  async function updateDiamondCount(seriesId) {
    if (!user) return false
    
    // Converte para número
    const numericSeriesId = parseInt(seriesId, 10)
    
    // === TUTORIAL NÃO CONTA PARA DIAMANTE ===
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return false
    }
    
    try {
      const { seriesData } = await import('../data/series')
      const series = seriesData[numericSeriesId]
      if (!series) return false
      
      const hasDiamond = await checkSeriesDiamond(numericSeriesId, series.episodes.length)
      if (!hasDiamond) return false
      
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      const currentData = userSnap.data() || {}
      
      const diamondSeriesIds = (currentData.diamondSeriesIds || []).map(id => parseInt(id, 10))
      if (diamondSeriesIds.includes(numericSeriesId)) return false // Já tem
      
      const newDiamondSeriesIds = [...diamondSeriesIds, numericSeriesId]
      const newCount = newDiamondSeriesIds.length

      await updateDoc(userRef, {
        diamondSeriesIds: newDiamondSeriesIds,
        seriesWithDiamond: newCount
      })
      
      setUserData(prev => ({
        ...prev,
        diamondSeriesIds: newDiamondSeriesIds,
        seriesWithDiamond: newCount
      }))

      return true // Ganhou diamante novo

    } catch (e) {
      console.error('Erro ao atualizar diamantes:', e)
      return false
    }
  }

  async function getSeriesProgress(seriesId) {
    if (!user) return []
    const numericSeriesId = parseInt(seriesId, 10)
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const snap = await getDocs(progressRef)
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => parseInt(p.seriesId, 10) === numericSeriesId)
  }

  async function checkSeriesDiamond(seriesId, totalEpisodes) {
    if (!user) return false
    const numericSeriesId = parseInt(seriesId, 10)
    
    // Tutorial nunca tem diamante
    if (numericSeriesId === TUTORIAL_SERIES_ID) return false
    
    const progress = await getSeriesProgress(numericSeriesId)
    const completedEpisodes = progress.filter(p => p.completed === true)
    
    if (completedEpisodes.length < totalEpisodes) return false
    
    const totalScore = completedEpisodes.reduce((acc, curr) => acc + (curr.dictationBestScore || 0), 0)
    const average = totalScore / totalEpisodes
    
    return average >= 95
  }

  async function getDiamondSeries(seriesData) {
    if (!user) return {}
    const diamonds = {}
    for (const [seriesId, series] of Object.entries(seriesData)) {
      const numericId = parseInt(seriesId, 10)
      // Pula tutorial
      if (numericId === TUTORIAL_SERIES_ID) continue
      
      const hasDiamond = await checkSeriesDiamond(numericId, series.episodes.length)
      diamonds[numericId] = hasDiamond
    }
    return diamonds
  }

  async function getProgress(seriesId, episodeId) {
    if (!user) return null
    const numericSeriesId = parseInt(seriesId, 10)
    const numericEpisodeId = parseInt(episodeId, 10)
    const progressRef = doc(db, 'users', user.uid, 'progress', `${numericSeriesId}_${numericEpisodeId}`)
    const snap = await getDoc(progressRef)
    return snap.exists() ? snap.data() : null
  }

  async function getLastProgress() {
    if (!user) return null
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const q = query(progressRef, orderBy('lastAccess', 'desc'), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) return null
    
    const data = snap.docs[0].data()
    
    // Se o último progresso for tutorial e estiver completo, busca o próximo
    if (parseInt(data.seriesId, 10) === TUTORIAL_SERIES_ID && data.completed) {
      const q2 = query(progressRef, orderBy('lastAccess', 'desc'), limit(2))
      const snap2 = await getDocs(q2)
      if (snap2.docs.length > 1) {
        return snap2.docs[1].data()
      }
      return null
    }
    
    return data
  }

  async function saveTranscription(data) {
    if (!user) return
    const docId = `${data.seriesId}_${data.episodeId}_${Date.now()}`
    const transcriptionRef = doc(db, 'users', user.uid, 'transcriptions', docId)
    await setDoc(transcriptionRef, { ...data, savedAt: new Date().toISOString() })
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
        totalEpisodesCompleted: 0,
        totalSeriesCompleted: 0,
        seriesWithDiamond: 0,
        perfectDictationCount: 0,
        perfectQuizCount: 0,
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

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const data = await createUserData(result.user.uid, result.user.email)
    setUserData(data)
    return result
  }

  async function signup(email, password, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const data = await createUserData(result.user.uid, result.user.email, name)
    setUserData(data)
    return result
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const data = await createUserData(result.user.uid, result.user.email, result.user.displayName)
    setUserData(data)
    return result
  }

  async function logout() {
    await signOut(auth)
    setUserData(null)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const data = await createUserData(user.uid, user.email, user.displayName)
        setUserData(data)
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
    saveDictationScore,
    saveQuizScore,
    getSeriesProgress,
    checkSeriesDiamond,
    getDiamondSeries,
    getUserBadges,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}