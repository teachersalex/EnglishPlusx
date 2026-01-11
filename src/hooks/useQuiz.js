// src/hooks/useQuiz.js
// Toda lógica do quiz de compreensão
// ============================================
// 🔧 v16 FIX: Modal aparece IMEDIATO (fire and forget)

import { useState, useRef, useCallback } from 'react'

export function useQuiz({
  questions = [],
  seriesId,
  episodeId,
  seriesTitle,
  episodeTitle,
  coverImage,
  audioTime = 0,
  wasAlreadyCompleted = false,
  // Callbacks do context
  user,
  updateUserXP,
  updateStreak,
  saveProgress,
  saveQuizScore
}) {
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [showMiniModal, setShowMiniModal] = useState(false)
  const [showFinalModal, setShowFinalModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [completedNow, setCompletedNow] = useState(false)
  
  // 🔧 v16: State para badges coletados assincronamente
  const [pendingBadges, setPendingBadges] = useState([])

  // 🔧 FIX: Guard contra double-click
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)

  // Refs para valores estáveis em async
  const scoreRef = useRef(0)

  // Computed
  const totalQuestions = questions.length
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  // ========== HANDLERS ==========

  const handleAnswer = useCallback(async (index) => {
    // 🔧 FIX: Guard triplo contra cliques duplicados
    if (selectedAnswer !== null || isSaving || isProcessingAnswer) return
    
    setIsProcessingAnswer(true)

    try {
      setSelectedAnswer(index)
      const isCorrect = index === currentQuestion.correctAnswer
      setLastAnswerCorrect(isCorrect)
      
      if (isCorrect) {
        const newScore = scoreRef.current + 1
        scoreRef.current = newScore
        setScore(newScore)
        
        // ANTI-FARM: Só dá XP se episódio NÃO foi completado antes
        if (user && !wasAlreadyCompleted && updateUserXP) {
          try {
            await updateUserXP(10)
          } catch (err) {
            console.error('Erro ao dar XP:', err)
          }
        }

        // Salva progresso parcial (fire and forget)
        if (user && saveProgress) {
          saveProgress(seriesId, episodeId, {
            audioTime,
            currentQuestion: currentQuestionIndex,
            questionsAnswered: currentQuestionIndex + 1,
            score: newScore,
            completed: false,
            seriesTitle,
            episodeTitle,
            coverImage
          }).catch(err => console.error('Erro ao salvar progresso:', err))
        }
      }

      // ANTI-FARM: Só atualiza streak se episódio NÃO foi completado antes
      if (user && !wasAlreadyCompleted && updateStreak) {
        updateStreak().catch(err => console.error('Erro ao atualizar streak:', err))
      }

      setShowMiniModal(true)

    } finally {
      setIsProcessingAnswer(false)
    }
  }, [
    selectedAnswer, isSaving, isProcessingAnswer, currentQuestion,
    wasAlreadyCompleted, user, audioTime, currentQuestionIndex,
    seriesId, episodeId, seriesTitle, episodeTitle, coverImage,
    updateUserXP, updateStreak, saveProgress
  ])

  const handleNextQuestion = useCallback(async () => {
    setShowMiniModal(false)
    
    if (isLastQuestion) {
      // 🔧 v16 FIX: Modal aparece IMEDIATAMENTE!
      setShowFinalModal(true)
      
      if (user && saveProgress) {
        setIsSaving(true)
        
        const finalQuizScore = scoreRef.current
        const isQuizPerfect = finalQuizScore === totalQuestions

        // 🔧 v16 FIX: Fire and forget - NÃO bloqueia a UI
        saveProgress(seriesId, episodeId, {
          audioTime,
          currentQuestion: totalQuestions,
          questionsAnswered: totalQuestions,
          score: finalQuizScore,
          completed: true,
          seriesTitle,
          episodeTitle,
          coverImage
        })
          .then(async (badgeCompletion) => {
            setCompletedNow(true)
            
            const badges = []
            if (badgeCompletion) badges.push(badgeCompletion)

            // Verifica quiz perfeito (só se não era completado antes)
            if (isQuizPerfect && saveQuizScore && !wasAlreadyCompleted) {
              try {
                const quizBadge = await saveQuizScore(seriesId, episodeId, finalQuizScore, totalQuestions)
                if (quizBadge) badges.push(quizBadge)
              } catch (err) {
                console.error('Erro ao salvar quiz score:', err)
              }
            }

            // 🔧 v16: Armazena badges para o componente pai consumir
            if (badges.length > 0) {
              setPendingBadges(badges)
            }
          })
          .catch(err => console.error('Erro ao salvar progresso final:', err))
          .finally(() => setIsSaving(false))
      }
      
      // Retorna vazio - badges virão via pendingBadges state
      return []
      
    } else {
      // Próxima pergunta
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setSelectedAnswer(null)
      
      // Salva progresso parcial (fire and forget)
      if (user && saveProgress) {
        saveProgress(seriesId, episodeId, {
          audioTime,
          currentQuestion: nextIndex,
          questionsAnswered: nextIndex,
          score: scoreRef.current,
          completed: wasAlreadyCompleted,
          seriesTitle,
          episodeTitle,
          coverImage
        }).catch(err => console.error('Erro ao salvar progresso:', err))
      }
    }

    return []
  }, [
    isLastQuestion, user, audioTime, totalQuestions, currentQuestionIndex,
    wasAlreadyCompleted, seriesId, episodeId, seriesTitle, episodeTitle, coverImage,
    saveProgress, saveQuizScore
  ])

  // 🔧 v16: Consome badges pendentes
  const consumePendingBadges = useCallback(() => {
    const badges = [...pendingBadges]
    setPendingBadges([])
    return badges
  }, [pendingBadges])

  const handleRestart = useCallback(() => {
    setShowFinalModal(false)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    scoreRef.current = 0
    setLastAnswerCorrect(false)
    setCompletedNow(false)
    setPendingBadges([])
  }, [])

  const closeFinalModal = useCallback(() => {
    setShowFinalModal(false)
  }, [])

  // Reset completo para mudança de episódio
  const fullReset = useCallback(() => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    scoreRef.current = 0
    setShowMiniModal(false)
    setShowFinalModal(false)
    setLastAnswerCorrect(false)
    setIsSaving(false)
    setIsProcessingAnswer(false)
    setCompletedNow(false)
    setPendingBadges([])
  }, [])

  // Carrega progresso salvo
  const loadProgress = useCallback((progress) => {
    if (progress) {
      setCurrentQuestionIndex(progress.currentQuestion || 0)
      const loadedScore = progress.score || 0
      setScore(loadedScore)
      scoreRef.current = loadedScore
    }
  }, [])

  return {
    // State
    currentQuestionIndex,
    selectedAnswer,
    score,
    lastAnswerCorrect,
    showMiniModal,
    showFinalModal,
    isSaving,
    isProcessingAnswer,
    completedNow,
    pendingBadges,  // 🔧 v16
    
    // Computed
    currentQuestion,
    totalQuestions,
    isLastQuestion,
    finalScore: scoreRef.current,
    xpEarned: scoreRef.current * 10,
    
    // Handlers
    handleAnswer,
    handleNextQuestion,
    handleRestart,
    closeFinalModal,
    fullReset,
    loadProgress,
    consumePendingBadges,  // 🔧 v16
    
    // Para MiniModal
    closeMiniModal: () => setShowMiniModal(false),
    retryQuestion: () => {
      setShowMiniModal(false)
      setSelectedAnswer(null)
    }
  }
}