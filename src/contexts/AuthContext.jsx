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
  checkForNewBadge, 
  buildBadgeContext 
} from '../utils/badgeSystem'

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
  // SISTEMA DE BADGES
  // ============================================
  async function checkAndAwardBadge(additionalContext = {}) {
    if (!user) return null
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentData = userSnap.data() || {}
    const currentBadges = currentData.badges || []
    
    const badgeContext = buildBadgeContext(currentData, additionalContext)
    const newBadge = checkForNewBadge(badgeContext, currentBadges)
    
    if (newBadge) {
      const updatedBadges = [...currentBadges, newBadge]
      await updateDoc(userRef, { badges: updatedBadges })
      setUserData(prev => ({ ...prev, badges: updatedBadges }))
    }
    
    return newBadge
  }

  // Atualizar XP
  async function updateUserXP(amount) {
    if (!user) return null
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { xp: increment(amount) })
    const newXP = (userData?.xp || 0) + amount
    setUserData(prev => ({ ...prev, xp: newXP }))
    
    return await checkAndAwardBadge({ xp: newXP })
  }

  // Atualizar Streak
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
      return await checkAndAwardBadge({ streak: newStreak })
    }
    return null
  }

  // ============================================
  // [FIX] SAVE PROGRESS COM RETORNO DE DIAMANTE
  // ============================================
  async function saveProgress(seriesId, episodeId, data) {
    if (!user) return null
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    
    const currentProgress = await getDoc(progressRef)
    const currentData = currentProgress.exists() ? currentProgress.data() : {}
    
    await setDoc(progressRef, {
      seriesId,
      episodeId,
      ...data,
      dictationBestScore: currentData.dictationBestScore || 0,
      lastAccess: new Date().toISOString()
    }, { merge: true })
    
    if (data.completed) {
      await updateCompletionCounters(seriesId, episodeId)
      
      // [FIX 1] Captura o badge de diamante se ele for ganho agora
      const diamondBadge = await updateDiamondCount(seriesId)

      // Verifica badge de conclusão (scholar, bookworm)
      const completionBadge = await checkAndAwardBadge({ 
        completedEpisode: true, 
        seriesId, 
        episodeId 
      })

      // [FIX 2] Retorna o Diamante se houver, senão o de conclusão
      // Isso garante que o modal mostre a conquista mais importante
      return diamondBadge || completionBadge
    }
    return null
  }

  async function updateCompletionCounters(seriesId, episodeId) {
    if (!user) return
    
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    const currentData = userSnap.data() || {}
    
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const progressSnap = await getDocs(progressRef)
    const completedEpisodes = progressSnap.docs.filter(d => d.data().completed === true).length
    
    let totalSeriesCompleted = currentData.totalSeriesCompleted || 0
    try {
      const { seriesData } = await import('../data/series')
      const series = seriesData[seriesId]
      if (series) {
        const seriesProgress = progressSnap.docs
          .filter(d => String(d.data().seriesId) === String(seriesId) && d.data().completed === true)
        
        if (seriesProgress.length >= series.episodes.length) {
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

  // ============================================
  // [FIX] SAVE DICTATION COM RETORNO DE DIAMANTE
  // ============================================
  async function saveDictationScore(seriesId, episodeId, score) {
    if (!user) return null
    
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    const currentProgress = await getDoc(progressRef)
    const currentData = currentProgress.exists() ? currentProgress.data() : {}
    
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
    
    const userRef = doc(db, 'users', user.uid)
    const updates = {}
    let shouldUpdateUser = false
    
    if (score === 100) {
      updates.hasAnyPerfectDictation = true
      updates.perfectDictationCount = increment(1)
      shouldUpdateUser = true
    }
    
    // [FIX 3] Captura o badge de diamante aqui também
    const diamondBadge = await updateDiamondCount(seriesId)
    
    if (shouldUpdateUser) {
      await updateDoc(userRef, updates)
      setUserData(prev => {
        const currentCount = prev.perfectDictationCount || 0
        return { 
          ...prev, 
          ...updates,
          perfectDictationCount: updates.perfectDictationCount ? currentCount + 1 : currentCount
        }
      })
    }
    
    const dictationBadge = await checkAndAwardBadge({ 
      hasAnyPerfectDictation: userData?.hasAnyPerfectDictation || (score === 100),
      seriesId
    })
    
    // [FIX 4] Prioriza o retorno do Diamante
    return diamondBadge || dictationBadge
  }

  // ============================================
  // [FIX] UPDATE DIAMOND QUE RETORNA O BADGE
  // ============================================
  async function updateDiamondCount(seriesId) {
    if (!user) return null // Retorno explícito null
    
    try {
      const { seriesData } = await import('../data/series')
      const series = seriesData[seriesId]
      if (!series) return null
      
      const hasDiamond = await checkSeriesDiamond(seriesId, series.episodes.length)
      if (!hasDiamond) return null
      
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      const currentData = userSnap.data() || {}
      
      const diamondSeriesIds = currentData.diamondSeriesIds || []
      if (diamondSeriesIds.includes(seriesId)) return null // Já tem
      
      const newDiamondSeriesIds = [...diamondSeriesIds, seriesId]
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

      // [FIX 5] A MÁGICA: Verifica e RETORNA o badge ganho
      return await checkAndAwardBadge({
        isDiamondUpdate: true,
        seriesWithDiamond: newCount
      })

    } catch (e) {
      console.error('Erro ao atualizar diamantes:', e)
      return null
    }
  }

  async function getSeriesProgress(seriesId) {
    if (!user) return []
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const snap = await getDocs(progressRef)
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => String(p.seriesId) === String(seriesId))
  }

  async function checkSeriesDiamond(seriesId, totalEpisodes) {
    if (!user) return false
    const progress = await getSeriesProgress(seriesId)
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
      const hasDiamond = await checkSeriesDiamond(seriesId, series.episodes.length)
      diamonds[seriesId] = hasDiamond
    }
    return diamonds
  }

  async function getProgress(seriesId, episodeId) {
    if (!user) return null
    const progressRef = doc(db, 'users', user.uid, 'progress', `${seriesId}_${episodeId}`)
    const snap = await getDoc(progressRef)
    return snap.exists() ? snap.data() : null
  }

  async function getLastProgress() {
    if (!user) return null
    const progressRef = collection(db, 'users', user.uid, 'progress')
    const q = query(progressRef, orderBy('lastAccess', 'desc'), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].data()
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
        hasAnyPerfectDictation: false,
        perfectDictationCount: 0,
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
    getSeriesProgress,
    checkSeriesDiamond,
    getDiamondSeries,
    getUserBadges,
    checkAndAwardBadge,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}