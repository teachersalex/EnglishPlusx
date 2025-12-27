// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../services/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

// Imports dos 5 services
import { userService } from '../services/userService'
import { progressService } from '../services/progressService'
import { transcriptionService } from '../services/transcriptionService'
import { diamondService } from '../services/diamondService'
import { gamificationService } from '../services/gamificationService'

// Badge definitions
import { BADGE_DEFINITIONS } from '../utils/badgeSystem'

export { BADGE_DEFINITIONS }

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

const TUTORIAL_SERIES_ID = 0

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // ============================================
  // AUTHENTICATION
  // ============================================

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const data = await userService.createOrGetUser(result.user.uid, result.user.email)
    setUserData(data)
    return result
  }

  async function signup(email, password, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const data = await userService.createOrGetUser(result.user.uid, result.user.email, name)
    setUserData(data)
    return result
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const data = await userService.createOrGetUser(result.user.uid, result.user.email, result.user.displayName)
    setUserData(data)
    return result
  }

  async function logout() {
    await signOut(auth)
    setUserData(null)
  }

  // ============================================
  // USER STATS (XP & STREAK)
  // ============================================

  async function updateUserXP(amount) {
    if (!user) return
    await userService.addXP(user.uid, amount)
    setUserData(prev => ({ ...prev, xp: (prev?.xp || 0) + amount }))
  }

  async function updateStreak(overrideUid = null) {
    const uid = overrideUid || user?.uid
    if (!uid) return

    const result = await userService.calculateAndUpdateStreak(uid)
    if (result) {
      setUserData(prev => ({
        ...prev,
        streak: result.streak,
        lastActivity: result.lastActivity
      }))
    }
  }

  // ============================================
  // PROGRESS & COMPLETION
  // ============================================

  async function saveProgress(seriesId, episodeId, data) {
    if (!user) return null

    // 1. Salva progresso do episódio
    const result = await progressService.saveEpisodeProgress(user.uid, seriesId, episodeId, data)

    // Tutorial não conta para nada
    if (result.numericSeriesId === TUTORIAL_SERIES_ID) {
      return null
    }

    if (!result.isCompleted) {
      return null
    }

    // 2. Atualiza estatísticas de conclusão
    const stats = await progressService.updateCompletionStats(user.uid, result.numericSeriesId)
    if (stats) {
      setUserData(prev => ({
        ...prev,
        totalEpisodesCompleted: stats.totalEpisodesCompleted
      }))
    }

    // 3. Carrega dados da série
    const { seriesData } = await import('../data/series')
    const series = seriesData[result.numericSeriesId]
    if (!series) return null

    const totalEpisodes = series.episodes.length

    // 4. Verifica progresso da série
    const seriesProgress = await progressService.getSeriesProgress(user.uid, result.numericSeriesId)
    const completedCount = seriesProgress.filter(p => p.completed === true).length

    // 5. SEMPRE verifica diamante quando episódio é completado
    // (diamante depende da média de scores, não só de completar)
    const gotNewDiamond = await diamondService.updateDiamondCount(user.uid, result.numericSeriesId, totalEpisodes)
    if (gotNewDiamond) {
      const userRef = await userService.createOrGetUser(user.uid, user.email)
      setUserData(prev => ({
        ...prev,
        diamondSeriesIds: userRef.diamondSeriesIds || [],
        seriesWithDiamond: userRef.seriesWithDiamond || 0
      }))
    }

    // 6. Se série foi completada, marca e verifica badge
    if (completedCount >= totalEpisodes) {
      const completionUpdate = await progressService.markSeriesAsCompleted(user.uid, result.numericSeriesId, seriesData)
      
      if (completionUpdate) {
        setUserData(prev => ({
          ...prev,
          completedSeriesIds: completionUpdate.completedSeriesIds,
          totalSeriesCompleted: completionUpdate.totalSeriesCompleted
        }))

        // Verifica badge de série
        const badge = await gamificationService.checkSeriesBadge(user.uid, {
          ...userData,
          completedSeriesIds: completionUpdate.completedSeriesIds,
          totalSeriesCompleted: completionUpdate.totalSeriesCompleted,
          seriesWithDiamond: gotNewDiamond ? (userData?.seriesWithDiamond || 0) + 1 : userData?.seriesWithDiamond
        })

        return badge
      }
    }

    return null
  }

  async function saveDictationScore(seriesId, episodeId, score) {
    if (!user) return null

    const isNewPerfect = await progressService.saveDictationScore(user.uid, seriesId, episodeId, score)

    if (isNewPerfect) {
      const newCount = (userData?.perfectDictationCount || 0) + 1
      setUserData(prev => ({
        ...prev,
        perfectDictationCount: newCount
      }))
      return await gamificationService.checkDictationBadge(user.uid, {
        ...userData,
        perfectDictationCount: newCount
      })
    }

    return null
  }

  async function saveQuizScore(seriesId, episodeId, score, totalQuestions) {
    if (!user) return null
    
    // Tutorial não conta
    if (parseInt(seriesId, 10) === TUTORIAL_SERIES_ID) return null

    const isNewPerfect = await progressService.saveQuizScore(user.uid, seriesId, episodeId, score, totalQuestions)

    if (isNewPerfect) {
      const newCount = (userData?.perfectQuizCount || 0) + 1
      setUserData(prev => ({
        ...prev,
        perfectQuizCount: newCount
      }))
      return await gamificationService.checkQuizBadge(user.uid, {
        ...userData,
        perfectQuizCount: newCount
      })
    }

    return null
  }

  // ============================================
  // PROGRESS GETTERS
  // ============================================

  async function getProgress(seriesId, episodeId) {
    if (!user) return null
    return progressService.getProgress(user.uid, seriesId, episodeId)
  }

  async function getLastProgress() {
    if (!user) return null
    return progressService.getLastProgress(user.uid)
  }

  async function getSeriesProgress(seriesId) {
    if (!user) return []
    return progressService.getSeriesProgress(user.uid, seriesId)
  }

  // ============================================
  // TRANSCRIPTIONS
  // ============================================

  async function saveTranscription(data) {
    if (!user) return
    return transcriptionService.saveTranscription(user.uid, data)
  }

  async function getTranscriptions(seriesId, episodeId) {
    if (!user) return []
    return transcriptionService.getTranscriptions(user.uid, seriesId, episodeId)
  }

  // ============================================
  // DIAMONDS & BADGES
  // ============================================

  async function checkSeriesDiamond(seriesId, totalEpisodes) {
    if (!user) return false
    return diamondService.checkSeriesDiamond(user.uid, seriesId, totalEpisodes)
  }

  async function getDiamondSeries(seriesData) {
    if (!user) return {}
    return diamondService.getDiamondSeries(user.uid, seriesData)
  }

  async function getUserBadges() {
    if (!user) return []
    return gamificationService.getUserBadges(user.uid)
  }

  // ============================================
  // AUTH STATE LISTENER
  // ============================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const data = await userService.createOrGetUser(u.uid, u.email, u.displayName)
        setUserData(data)
        await updateStreak(u.uid)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    user,
    userData,
    loading,
    // Auth
    login,
    signup,
    loginWithGoogle,
    logout,
    // User Stats
    updateUserXP,
    updateStreak,
    // Progress
    saveProgress,
    getProgress,
    getLastProgress,
    getSeriesProgress,
    // Scores
    saveDictationScore,
    saveQuizScore,
    // Transcriptions
    saveTranscription,
    getTranscriptions,
    // Diamonds & Badges
    checkSeriesDiamond,
    getDiamondSeries,
    getUserBadges
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}