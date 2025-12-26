// src/components/AudioPlayer.jsx
// Player principal - Orquestra os componentes
// v11 - Refatorado e organizado
// ============================================

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateDiff } from '../utils/dictationDiff'
import { useAuth } from '../contexts/AuthContext'
import BadgeCelebrationModal from './modals/BadgeCelebrationModal'
import DictationInput from './DictationInput'
import DictationResult from './DictationResult'

export default function AudioPlayer({ 
  audioUrl, 
  coverImage, 
  episodeTitle, 
  initialTime, 
  onTimeUpdate, 
  transcript, 
  showQuiz, 
  setShowQuiz,
  seriesId,
  episodeId 
}) {
  const audioRef = useRef(null)
  const { user, saveTranscription, saveDictationScore, updateUserXP, updateStreak, getProgress } = useAuth()
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  // Dictation state
  const [showDictation, setShowDictation] = useState(false)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [previousBest, setPreviousBest] = useState(0)
  
  // Badge queue system (v7)
  const [celebratingBadge, setCelebratingBadge] = useState(null)
  const [pendingBadges, setPendingBadges] = useState([])
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5]

  // ========== AUDIO EFFECTS ==========
  
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleLoaded = () => {
      setDuration(audio.duration)
      if (initialTime && initialTime > 0) audio.currentTime = initialTime
    }
    audio.addEventListener('loadedmetadata', handleLoaded)
    return () => audio.removeEventListener('loadedmetadata', handleLoaded)
  }, [initialTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setIsPlaying(false)
      if (onTimeUpdate) onTimeUpdate(audio.currentTime)
    }
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onTimeUpdate])

  useEffect(() => {
    if (!onTimeUpdate) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        onTimeUpdate(audioRef.current.currentTime)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [onTimeUpdate])

  // Badge queue processor
  useEffect(() => {
    if (!celebratingBadge && pendingBadges.length > 0) {
      const [next, ...rest] = pendingBadges
      setCelebratingBadge(next)
      setPendingBadges(rest)
    }
  }, [celebratingBadge, pendingBadges])

  // ========== PLAYER HANDLERS ==========

  const handlePause = () => {
    if (onTimeUpdate && audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime)
    }
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (isPlaying) {
      audio.pause()
      handlePause()
    } else {
      try {
        await audio.play()
      } catch (err) {
        console.error('Erro ao tocar áudio:', err)
      }
    }
    setIsPlaying(!isPlaying)
  }

  const changeSpeed = (speed) => {
    setPlaybackRate(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skip = (seconds) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration))
    }
  }

  const handleOpenQuiz = () => {
    setShowQuiz(true)
    setShowDictation(false)
  }

  const handleOpenDictation = () => {
    setShowDictation(true)
    setShowQuiz(false)
  }

  // ========== DICTATION HANDLERS ==========

  const handleCheck = async () => {
    if (!userText.trim() || !transcript) return
    
    const result = calculateDiff(transcript, userText, episodeTitle)
    setFeedback(result)
    
    const newAttemptCount = attemptCount + 1
    setAttemptCount(newAttemptCount)
    
    // Calcula XP baseado no score
    let xp = 1 // <70% = 1 XP (incentivo)
    if (result.score >= 90) xp = 20
    else if (result.score >= 70) xp = 10
    
    setXpEarned(xp)
    
    // Verifica se é novo recorde
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
    
    // Coleta badges
    const collectedBadges = []
    
    if (user && updateStreak) {
      try {
        const badge = await updateStreak()
        if (badge) collectedBadges.push(badge)
      } catch (err) {
        console.error("Erro ao atualizar streak:", err)
      }
    }
    
    if (user && updateUserXP) {
      try {
        const badge = await updateUserXP(xp)
        if (badge) collectedBadges.push(badge)
      } catch (err) {
        console.error("Erro ao dar XP:", err)
      }
    }
    
    if (user && saveDictationScore && seriesId && episodeId) {
      try {
        const badge = await saveDictationScore(seriesId, episodeId, result.score)
        if (badge) collectedBadges.push(badge)
      } catch (err) {
        console.error("Erro ao salvar dictation score:", err)
      }
    }
    
    // Gerencia fila de badges
    const uniqueBadges = [...new Set(collectedBadges.filter(Boolean))]
    if (uniqueBadges.length > 0) {
      const [first, ...rest] = uniqueBadges
      setCelebratingBadge(first)
      if (rest.length > 0) setPendingBadges(rest)
    }
    
    // Auto-save da transcrição
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
  }

  const handleReset = () => {
    setUserText('')
    setFeedback(null)
    setXpEarned(0)
    setIsNewRecord(false)
  }

  const handleBadgeCelebrationComplete = () => {
    setCelebratingBadge(null)
  }

  // ========== UTILS ==========

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  // ========== RENDER ==========

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl max-w-full overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Capa com Breathing Effect */}
      <div className="mb-6 perspective-1000">
        <img 
          src={coverImage} 
          alt={episodeTitle} 
          className={`w-full h-48 object-cover rounded-xl transition-transform duration-500 ${isPlaying ? 'breathing-cover' : ''}`} 
        />
        <p className="text-white font-bold text-center mt-3">{episodeTitle}</p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div 
          className="h-2 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-2 rounded-full smooth-progress relative sexy-progress-bar bg-[#E50914]" 
            style={{ width: `${progress}%` }} 
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
        <div className="flex justify-between text-white/60 text-xs mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(-5)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20 hover:scale-105 transition-all">-5s</motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={togglePlay} 
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-[0_0_20px_rgba(229,9,20,0.6)] hover:scale-105 transition-all z-10"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </motion.button>
        
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(5)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20 hover:scale-105 transition-all">+5s</motion.button>
      </div>

      {/* Velocidades */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {speeds.map((speed) => (
          <motion.button
            key={speed}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${playbackRate === speed ? 'bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.4)]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenDictation}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shine-effect ${
            showDictation 
              ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Ditado
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenQuiz}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shine-effect ${
            showQuiz 
              ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quiz
        </motion.button>
      </div>

      {/* Área de Ditado */}
      <AnimatePresence>
        {showDictation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            {!feedback ? (
              <DictationInput 
                userText={userText}
                setUserText={setUserText}
                onCheck={handleCheck}
              />
            ) : (
              <DictationResult 
                feedback={feedback}
                xpEarned={xpEarned}
                isNewRecord={isNewRecord}
                onReset={handleReset}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de celebração */}
      <BadgeCelebrationModal 
        badge={celebratingBadge} 
        onComplete={handleBadgeCelebrationComplete} 
      />
    </div>
  )
}