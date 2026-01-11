// src/components/audio/AudioPlayer.jsx
// Player principal refatorado
// Usa hooks para lógica, componentes para UI
// ============================================
// 🔧 FIX v16: useCallback para onAudioComplete (previne audio.pause() no cleanup)

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Hooks
import { useAudioPlayer } from '../../hooks/useAudioPlayer'
import { useDictation } from '../../hooks/useDictation'
import { useBadgeQueue } from '../../hooks/useBadgeQueue'

// Contexts
import { useAuth } from '../../contexts/AuthContext'
import { useUserData } from '../../contexts/UserDataContext'
import { useProgress } from '../../contexts/ProgressContext'

// Components
import AudioControls from './AudioControls'
import ProgressStepper from './ProgressStepper'
import DictationInput from '../DictationInput'
import DictationResult from '../DictationResult'
import BadgeCelebrationModal from '../modals/BadgeCelebrationModal'

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
  episodeId,
  wasAlreadyCompleted = false
}) {
  const { user } = useAuth()
  const { updateUserXP, updateStreak } = useUserData()
  const { getProgress, saveDictationScore, saveTranscription } = useProgress()
  
  // Stepper state
  const [audioCompleted, setAudioCompleted] = useState(false)
  const [dictationDone, setDictationDone] = useState(false)
  const [quizDone, setQuizDone] = useState(false)
  const [showDictation, setShowDictation] = useState(false)

  // Derived
  const allUnlocked = wasAlreadyCompleted
  const canAccessDictation = allUnlocked || audioCompleted
  const canAccessQuiz = allUnlocked || dictationDone

  // ========== CALLBACKS ESTÁVEIS ==========
  // 🔧 FIX: useCallback previne que a função seja recriada a cada render
  // Isso evita que o useEffect do useAudioPlayer execute cleanup (audio.pause())
  
  const handleAudioComplete = useCallback(() => {
    setAudioCompleted(true)
  }, [])

  // ========== HOOKS ==========

  const audioPlayer = useAudioPlayer({
    audioUrl,
    initialTime,
    onTimeUpdate,
    onAudioComplete: handleAudioComplete  // 🔧 FIX: Referência estável
  })

  const dictation = useDictation({
    transcript,
    episodeTitle,
    seriesId,
    episodeId,
    wasAlreadyCompleted,
    getProgress,
    updateStreak,
    updateUserXP,
    saveDictationScore,
    saveTranscription,
    user
  })

  const badgeQueue = useBadgeQueue()

  // ========== EFFECTS ==========

  // Reset quando muda de episódio
  useEffect(() => {
    setAudioCompleted(false)
    setDictationDone(false)
    setQuizDone(false)
    setShowDictation(false)
    audioPlayer.reset()
    dictation.fullReset()
    badgeQueue.clearQueue()
  }, [seriesId, episodeId])

  // ========== HANDLERS ==========

  const handleOpenDictation = () => {
    if (!canAccessDictation) return
    setShowDictation(true)
    setShowQuiz(false)
  }

  const handleOpenQuiz = () => {
    if (!canAccessQuiz) return
    setShowQuiz(true)
    setShowDictation(false)
  }

  const handleDictationCheck = async () => {
    const badges = await dictation.handleCheck()
    setDictationDone(true)
    if (badges?.length > 0) {
      badgeQueue.queueBadges(badges)
    }
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioPlayer.seekToPercent(percent)
  }

  // ========== RENDER ==========

  return (
    <div 
      data-tour="player"
      className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl max-w-full overflow-hidden"
    >
      <audio 
        ref={audioPlayer.audioRef} 
        src={audioUrl} 
        preload="metadata" 
      />

      {/* Capa com Breathing Effect */}
      <div className="mb-6 perspective-1000">
        <img 
          src={coverImage} 
          alt={episodeTitle} 
          className={`w-full h-48 object-cover rounded-xl transition-transform duration-500 ${
            audioPlayer.isPlaying ? 'breathing-cover' : ''
          }`} 
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
            style={{ width: `${audioPlayer.progress}%` }} 
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
        <div className="flex justify-between text-white/60 text-xs mt-2">
          <span>{audioPlayer.formatTime(audioPlayer.currentTime)}</span>
          <span>{audioPlayer.formatTime(audioPlayer.duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <AudioControls
        isPlaying={audioPlayer.isPlaying}
        playbackRate={audioPlayer.playbackRate}
        onTogglePlay={audioPlayer.togglePlay}
        onSkip={audioPlayer.skip}
        onChangeSpeed={audioPlayer.changeSpeed}
      />

      {/* Botões de ação */}
      <div className="flex gap-3">
        {/* Dictation Button */}
        <motion.button
          whileHover={canAccessDictation ? { scale: 1.02 } : {}}
          whileTap={canAccessDictation ? { scale: 0.98 } : {}}
          onClick={handleOpenDictation}
          disabled={!canAccessDictation}
          data-tour="dictation-button"
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            !canAccessDictation
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : showDictation 
                ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                : 'bg-white/10 text-white hover:bg-white/20 shine-effect'
          }`}
        >
          {!canAccessDictation ? (
            <LockIcon />
          ) : (
            <EditIcon />
          )}
          Ditado
        </motion.button>

        {/* Quiz Button */}
        <motion.button
          whileHover={canAccessQuiz ? { scale: 1.02 } : {}}
          whileTap={canAccessQuiz ? { scale: 0.98 } : {}}
          onClick={handleOpenQuiz}
          disabled={!canAccessQuiz}
          data-tour="quiz-button"
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            !canAccessQuiz
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : showQuiz 
                ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' 
                : 'bg-white/10 text-white hover:bg-white/20 shine-effect'
          }`}
        >
          {!canAccessQuiz ? (
            <LockIcon />
          ) : (
            <QuizIcon />
          )}
          Quiz
        </motion.button>
      </div>

      {/* Stepper de Progresso */}
      <AnimatePresence>
        {(showDictation || showQuiz) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <ProgressStepper 
              audioCompleted={audioCompleted}
              dictationDone={dictationDone}
              quizDone={quizDone}
              allUnlocked={allUnlocked}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área de Ditado */}
      <AnimatePresence>
        {showDictation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            data-tour="dictation-area"
          >
            {!dictation.hasFeedback ? (
              <DictationInput 
                userText={dictation.userText}
                setUserText={dictation.setUserText}
                onCheck={handleDictationCheck}
                disabled={dictation.isProcessing}
              />
            ) : (
              <DictationResult 
                feedback={dictation.feedback}
                xpEarned={dictation.xpEarned}
                isNewRecord={dictation.isNewRecord}
                onReset={dictation.handleReset}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de celebração */}
      <BadgeCelebrationModal 
        badge={badgeQueue.activeBadge} 
        onComplete={badgeQueue.completeBadge} 
      />
    </div>
  )
}

// ========== ICONS ==========

function LockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function QuizIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}