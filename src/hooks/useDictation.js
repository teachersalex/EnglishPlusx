// src/hooks/useDictation.js
// Toda lógica do exercício de ditado
// ============================================

import { useState, useCallback, useRef } from 'react'
import { calculateDiff } from '../utils/dictationDiff'

export function useDictation({
  transcript,
  episodeTitle,
  seriesId,
  episodeId,
  wasAlreadyCompleted = false,
  // Callbacks do context
  getProgress,
  updateStreak,
  updateUserXP,
  saveDictationScore,
  saveTranscription,
  user
}) {
  // State
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [previousBest, setPreviousBest] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // 🔧 FIX: Ref para garantir XP só na primeira tentativa do episódio
  const hasGivenXPRef = useRef(false)

  // ========== HANDLERS ==========

  const handleCheck = useCallback(async () => {
    if (!userText.trim() || !transcript || isProcessing) return
    
    setIsProcessing(true)
    const collectedBadges = []

    try {
      // Calcula resultado
      const result = calculateDiff(transcript, userText, episodeTitle)
      setFeedback(result)
      
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)
      
      // Calcula XP baseado no score
      let xp = 1 // <70% = 1 XP (incentivo)
      if (result.score >= 90) xp = 20
      else if (result.score >= 70) xp = 10
      
      setXpEarned(xp)
      
      // Verifica recorde anterior
      if (user && getProgress && seriesId && episodeId) {
        try {
          const progress = await getProgress(seriesId, episodeId)
          const prevBest = progress?.dictationBestScore || 0
          setPreviousBest(prevBest)
          setIsNewRecord(result.score > prevBest)
        } catch (err) {
          console.error("Erro ao buscar recorde:", err)
        }
      }

      // 🔧 FIX: Só dá XP na PRIMEIRA tentativa E se episódio não foi completado
      const shouldGiveXP = !hasGivenXPRef.current && !wasAlreadyCompleted
      
      // Atualiza streak (sempre, para manter engajamento)
      if (user && updateStreak) {
        try {
          const badge = await updateStreak()
          if (badge) collectedBadges.push(badge)
        } catch (err) {
          console.error("Erro ao atualizar streak:", err)
        }
      }
      
      // Dá XP apenas se permitido
      if (user && updateUserXP && shouldGiveXP) {
        try {
          const badge = await updateUserXP(xp)
          if (badge) collectedBadges.push(badge)
          hasGivenXPRef.current = true // Marca que já deu XP neste episódio
        } catch (err) {
          console.error("Erro ao dar XP:", err)
        }
      }
      
      // Salva score do ditado (pode melhorar recorde em retry)
      if (user && saveDictationScore && seriesId && episodeId) {
        try {
          const badge = await saveDictationScore(seriesId, episodeId, result.score)
          if (badge) collectedBadges.push(badge)
        } catch (err) {
          console.error("Erro ao salvar dictation score:", err)
        }
      }
      
      // Salva transcrição para histórico
      if (user && saveTranscription) {
        try {
          await saveTranscription({
            seriesId,
            episodeId,
            episodeTitle,
            userText: userText.trim(),
            score: result.score,
            correctCount: result.correctCount,
            total: result.total,
            extraCount: result.extraCount,
            missingCount: result.missingCount,
            wrongCount: result.wrongCount,
            attemptNumber: newAttemptCount,
            timestamp: new Date().toISOString()
          })
        } catch (err) {
          console.error("Erro ao salvar transcrição:", err)
        }
      }

      // Retorna badges coletados (sem duplicatas)
      return [...new Set(collectedBadges.filter(Boolean))]
      
    } finally {
      setIsProcessing(false)
    }
  }, [
    userText, transcript, episodeTitle, attemptCount, isProcessing,
    wasAlreadyCompleted, seriesId, episodeId, user,
    getProgress, updateStreak, updateUserXP, saveDictationScore, saveTranscription
  ])

  // Reset para tentar novamente
  const handleReset = useCallback(() => {
    setUserText('')
    setFeedback(null)
    setXpEarned(0)
    setIsNewRecord(false)
    // NÃO reseta attemptCount nem hasGivenXPRef - anti-farm
  }, [])

  // Reset completo para mudança de episódio
  const fullReset = useCallback(() => {
    setUserText('')
    setFeedback(null)
    setAttemptCount(0)
    setXpEarned(0)
    setIsNewRecord(false)
    setPreviousBest(0)
    setIsProcessing(false)
    hasGivenXPRef.current = false
  }, [])

  return {
    // State
    userText,
    setUserText,
    feedback,
    attemptCount,
    xpEarned,
    isNewRecord,
    previousBest,
    isProcessing,
    
    // Computed
    canSubmit: userText.trim().length > 0 && !isProcessing,
    hasFeedback: feedback !== null,
    
    // Handlers
    handleCheck,
    handleReset,
    fullReset
  }
}
