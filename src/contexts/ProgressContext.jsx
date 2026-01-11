// src/contexts/ProgressContext.jsx
// Gerencia progresso de episódios e scores
// ============================================

import { createContext, useContext, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useUserData } from './UserDataContext'
import { progressService } from '../services/progressService'
import { diamondService } from '../services/diamondService'
import { gamificationService } from '../services/gamificationService'
import { transcriptionService } from '../services/transcriptionService'
import { userService } from '../services/userService'
import { seriesData } from '../data/series'
import { TUTORIAL_SERIES_ID } from '../constants'

const ProgressContext = createContext()

export function useProgress() {
  return useContext(ProgressContext)
}

export function ProgressProvider({ children }) {
  const { user } = useAuth()
  const { userData, setUserData } = useUserData()

  // ========== VALIDATION ==========

  const validateIds = useCallback((seriesId, episodeId) => {
    const numericSeriesId = parseInt(seriesId, 10)
    const numericEpisodeId = parseInt(episodeId, 10)
    
    if (isNaN(numericSeriesId) || isNaN(numericEpisodeId)) {
      console.error('[Progress] IDs inválidos:', { seriesId, episodeId })
      return null
    }
    
    return { seriesId: numericSeriesId, episodeId: numericEpisodeId }
  }, [])

  // ========== SAVE PROGRESS ==========

  const saveProgress = useCallback(async (seriesId, episodeId, data) => {
    if (!user) return null
    
    // Valida IDs
    const ids = validateIds(seriesId, episodeId)
    if (!ids) return null
    
    // Valida data
    if (!data || typeof data !== 'object') {
      console.error('[Progress] Data inválido:', data)
      return null
    }

    // 1. Salva progresso do episódio
    const result = await progressService.saveEpisodeProgress(
      user.uid, 
      ids.seriesId, 
      ids.episodeId, 
      data
    )

    // Tutorial não conta para gamificação
    if (result.numericSeriesId === TUTORIAL_SERIES_ID) {
      return null
    }

    if (!result.isCompleted) {
      return null
    }

    // 2. Operações paralelas para melhor performance
    const [stats, seriesProgress] = await Promise.all([
      progressService.updateCompletionStats(user.uid, result.numericSeriesId),
      progressService.getSeriesProgress(user.uid, result.numericSeriesId)
    ])

    if (stats) {
      setUserData(prev => ({
        ...prev,
        totalEpisodesCompleted: stats.totalEpisodesCompleted
      }))
    }

    // 3. Verifica série
    const series = seriesData[result.numericSeriesId]
    if (!series) return null

    const totalEpisodes = series.episodes.length
    const completedCount = seriesProgress.filter(p => p.completed === true).length

    // 4. Verifica diamante
    const gotNewDiamond = await diamondService.updateDiamondCount(
      user.uid, 
      result.numericSeriesId, 
      totalEpisodes
    )
    
    if (gotNewDiamond) {
      const userRef = await userService.createOrGetUser(user.uid, user.email)
      setUserData(prev => ({
        ...prev,
        diamondSeriesIds: userRef.diamondSeriesIds || [],
        seriesWithDiamond: userRef.seriesWithDiamond || 0
      }))
    }

    // 5. Se série foi completada
    if (completedCount >= totalEpisodes) {
      const completionUpdate = await progressService.markSeriesAsCompleted(
        user.uid, 
        result.numericSeriesId, 
        seriesData
      )
      
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
          seriesWithDiamond: gotNewDiamond 
            ? (userData?.seriesWithDiamond || 0) + 1 
            : userData?.seriesWithDiamond
        })

        return badge
      }
    }

    return null
  }, [user, userData, setUserData, validateIds])

  // ========== SCORES ==========

  const saveDictationScore = useCallback(async (seriesId, episodeId, score) => {
    if (!user) return null
    
    const ids = validateIds(seriesId, episodeId)
    if (!ids) return null

    const isNewPerfect = await progressService.saveDictationScore(
      user.uid, 
      ids.seriesId, 
      ids.episodeId, 
      score
    )

    if (isNewPerfect) {
      const newCount = (userData?.perfectDictationCount || 0) + 1
      setUserData(prev => ({
        ...prev,
        perfectDictationCount: newCount
      }))
      
      return gamificationService.checkDictationBadge(user.uid, {
        ...userData,
        perfectDictationCount: newCount
      })
    }

    return null
  }, [user, userData, setUserData, validateIds])

  const saveQuizScore = useCallback(async (seriesId, episodeId, score, totalQuestions) => {
    if (!user) return null
    
    const ids = validateIds(seriesId, episodeId)
    if (!ids) return null
    
    // Tutorial não conta
    if (ids.seriesId === TUTORIAL_SERIES_ID) return null

    const isNewPerfect = await progressService.saveQuizScore(
      user.uid, 
      ids.seriesId, 
      ids.episodeId, 
      score, 
      totalQuestions
    )

    if (isNewPerfect) {
      const newCount = (userData?.perfectQuizCount || 0) + 1
      setUserData(prev => ({
        ...prev,
        perfectQuizCount: newCount
      }))
      
      return gamificationService.checkQuizBadge(user.uid, {
        ...userData,
        perfectQuizCount: newCount
      })
    }

    return null
  }, [user, userData, setUserData, validateIds])

  // ========== GETTERS ==========

  const getProgress = useCallback(async (seriesId, episodeId) => {
    if (!user) return null
    return progressService.getProgress(user.uid, seriesId, episodeId)
  }, [user])

  const getLastProgress = useCallback(async () => {
    if (!user) return null
    return progressService.getLastProgress(user.uid)
  }, [user])

  const getSeriesProgress = useCallback(async (seriesId) => {
    if (!user) return []
    return progressService.getSeriesProgress(user.uid, seriesId)
  }, [user])

  // ========== TRANSCRIPTIONS ==========

  const saveTranscription = useCallback(async (data) => {
    if (!user) return
    return transcriptionService.saveTranscription(user.uid, data)
  }, [user])

  const getTranscriptions = useCallback(async (seriesId, episodeId) => {
    if (!user) return []
    return transcriptionService.getTranscriptions(user.uid, seriesId, episodeId)
  }, [user])

  // ========== CONTEXT VALUE ==========

  const value = {
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
    getTranscriptions
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}
