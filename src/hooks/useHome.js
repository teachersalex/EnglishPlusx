// src/hooks/useHome.js
// Toda lógica da Home separada
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { seriesData } from '../data/series'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'
import { useProgress } from '../contexts/ProgressContext'
import { OnboardingStorage } from '../utils/onboardingStorage'

export function useHome() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { userData, isLoading: userLoading } = useUserData()
  const { getLastProgress } = useProgress()
  
  const [continueEpisode, setContinueEpisode] = useState(null)
  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  // ========== COMPUTED ==========
  
  const isLoading = user && (authLoading || userLoading)
  const completedSeriesIds = userData?.completedSeriesIds || []
  
  // Diamantes direto do userData
  const diamondSeries = (userData?.diamondSeriesIds || []).reduce((acc, id) => {
    acc[parseInt(id, 10)] = true
    return acc
  }, {})
  
  // Tutorial: completo se fez série 0 OU se tem progresso antigo
  const hasExistingProgress = (userData?.xp || 0) > 0 || (userData?.totalSeriesCompleted || 0) > 0
  const tutorialSeriesCompleted = completedSeriesIds.some(id => parseInt(id, 10) === 0)
  const tutorialCompleted = tutorialSeriesCompleted || hasExistingProgress

  // ========== TOUR ==========
  
  useEffect(() => {
    if (user && !tutorialCompleted && !OnboardingStorage.isComplete()) {
      const step = OnboardingStorage.getStep()
      if (!step || step === 'home') {
        const timer = setTimeout(() => setShowTour(true), 500)
        return () => clearTimeout(timer)
      }
    }
  }, [user, tutorialCompleted])

  // ========== CONTINUE WATCHING ==========
  
  useEffect(() => {
    async function loadContinue() {
      if (!user || !getLastProgress) return

      try {
        const lastProgress = await getLastProgress()
        
        if (!lastProgress) {
          setContinueEpisode(null)
          return
        }

        const series = seriesData[lastProgress.seriesId]
        if (!series) {
          setContinueEpisode(null)
          return
        }

        const currentEpisodeId = parseInt(lastProgress.episodeId, 10)
        const episode = series.episodes.find(ep => ep.id === currentEpisodeId)
        const totalQuestions = episode?.questions?.length || 3

        // CASO 1: Episódio NÃO COMPLETO → mostra esse
        if (!lastProgress.completed) {
          setContinueEpisode({
            url: `/series/${lastProgress.seriesId}/episode/${currentEpisodeId}`,
            coverImage: series.coverImage,
            seriesTitle: series.title,
            episodeTitle: lastProgress.episodeTitle || episode?.title || `Episódio ${currentEpisodeId}`,
            progress: Math.round((lastProgress.questionsAnswered / totalQuestions) * 100),
            questionsAnswered: lastProgress.questionsAnswered || 0,
            totalQuestions
          })
          return
        }

        // CASO 2: Episódio COMPLETO → verifica próximo
        const nextEpisode = series.episodes.find(ep => ep.id === currentEpisodeId + 1)
        
        if (nextEpisode) {
          setContinueEpisode({
            url: `/series/${lastProgress.seriesId}/episode/${nextEpisode.id}`,
            coverImage: series.coverImage,
            seriesTitle: series.title,
            episodeTitle: nextEpisode.title,
            progress: 0,
            questionsAnswered: 0,
            totalQuestions: nextEpisode.questions?.length || 3
          })
        } else {
          // CASO 3: Série completa
          setContinueEpisode(null)
        }

      } catch (error) {
        console.error("Erro ao carregar progresso:", error)
        setContinueEpisode(null)
      }
    }
    
    loadContinue()
  }, [user, getLastProgress])

  // ========== HANDLERS ==========
  
  const handleSeriesClick = (id) => navigate(`/series/${id}`)
  const handleTourComplete = () => setShowTour(false)
  const handleTourStepChange = (newStep) => setTourStep(newStep)

  return {
    // State
    user,
    userData,
    isLoading,
    continueEpisode,
    showTour,
    tourStep,
    
    // Computed
    tutorialCompleted,
    completedSeriesIds,
    diamondSeries,
    
    // Handlers
    handleSeriesClick,
    handleTourComplete,
    handleTourStepChange
  }
}