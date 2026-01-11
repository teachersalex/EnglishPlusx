// src/components/episode/EpisodePage.jsx
// Página do episódio refatorada
// Usa hooks para lógica, componentes para UI
// ============================================
// 🔧 v16 FIX: useCallback para handleTimeUpdate + badges via useEffect

import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { seriesData } from '../../data/series'
import { TUTORIAL_SERIES_ID } from '../../constants'

// Contexts
import { useAuth } from '../../contexts/AuthContext'
import { useUserData } from '../../contexts/UserDataContext'
import { useProgress } from '../../contexts/ProgressContext'

// Hooks
import { useQuiz } from '../../hooks/useQuiz'
import { useBadgeQueue } from '../../hooks/useBadgeQueue'

// Components
import Header from '../Header'
import AudioPlayer from '../audio/AudioPlayer'
import QuizSection from './QuizSection'
import MiniModal from '../modals/MiniModal'
import FinalModal from '../modals/FinalModal'
import BadgeCelebrationModal from '../modals/BadgeCelebrationModal'
import OnboardingTour from '../OnboardingTour'
import { OnboardingStorage } from '../../utils/onboardingStorage'

// Tour steps
const EPISODE_TOUR_STEPS = [
  {
    target: '[data-tour="player"]',
    emoji: '🎧',
    title: 'Este é o player',
    description: 'Aqui você ouve o áudio do episódio. Pode pausar, voltar e avançar.',
    position: 'top',
    allowClick: false,
  },
  {
    target: '[data-tour="speed-controls"]',
    emoji: '🐢',
    title: 'Controle de velocidade',
    description: 'Está difícil? Use 0.5x ou 0.75x para ouvir mais devagar.',
    position: 'top',
    allowClick: false,
  },
  {
    target: '[data-tour="dictation-button"]',
    emoji: '✍️',
    title: 'Ditado',
    description: 'Depois de ouvir, clique aqui para escrever o que entendeu.',
    position: 'top',
    allowClick: false,
  },
  {
    target: '[data-tour="quiz-button"]',
    emoji: '📝',
    title: 'Quiz',
    description: 'Perguntas sobre o áudio para testar sua compreensão.',
    position: 'top',
    allowClick: false,
  },
  {
    target: '[data-tour="play-button"]',
    emoji: '▶️',
    title: 'Agora é com você!',
    description: 'Clique no play para começar a ouvir. Boa sorte!',
    position: 'bottom',
    allowClick: true,
    finishTour: true,
  },
]

export default function EpisodePage() {
  const { id, episodeId } = useParams()
  const navigate = useNavigate()
  
  // Contexts
  const { user } = useAuth()
  const { updateUserXP, updateStreak } = useUserData()
  const { saveProgress, getProgress, saveQuizScore } = useProgress()
  
  // Local state
  const [audioTime, setAudioTime] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(true)
  const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  
  // Tour state
  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  
  // Refs
  const hasLoadedProgress = useRef(false)
  const lastSaveTimeRef = useRef(0)

  // Data
  const series = seriesData[id]
  const episode = series?.episodes.find(ep => ep.id === parseInt(episodeId))
  const isTutorial = parseInt(id, 10) === TUTORIAL_SERIES_ID

  // ========== HOOKS ==========

  const quiz = useQuiz({
    questions: episode?.questions || [],
    seriesId: id,
    episodeId,
    seriesTitle: series?.title,
    episodeTitle: episode?.title,
    coverImage: series?.coverImage,
    audioTime,
    wasAlreadyCompleted,
    user,
    updateUserXP,
    updateStreak,
    saveProgress,
    saveQuizScore
  })

  const badgeQueue = useBadgeQueue()

  // ========== CALLBACKS ESTÁVEIS ==========
  // 🔧 FIX: useCallback previne que a função seja recriada a cada render
  
  const handleTimeUpdate = useCallback((time) => {
    if (!user) return
    setAudioTime(time)
    
    const now = Date.now()
    if (now - lastSaveTimeRef.current < 8000) return
    lastSaveTimeRef.current = now
    
    if (!series || !episode) return
    
    saveProgress(id, episodeId, {
      audioTime: time,
      currentQuestion: quiz.currentQuestionIndex,
      questionsAnswered: quiz.currentQuestionIndex,
      score: quiz.score,
      completed: wasAlreadyCompleted,
      seriesTitle: series.title,
      episodeTitle: episode.title,
      coverImage: series.coverImage
    }).catch(err => console.error('Erro ao salvar progresso:', err))
  }, [
    user, 
    id, 
    episodeId, 
    series, 
    episode, 
    wasAlreadyCompleted,
    quiz.currentQuestionIndex, 
    quiz.score, 
    saveProgress
  ])

  // ========== EFFECTS ==========

  // Tour para tutorial
  useEffect(() => {
    if (isTutorial && OnboardingStorage.getStep() === 'episode') {
      const timer = setTimeout(() => setShowTour(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isTutorial])

  // 🔧 v16 FIX: Consome badges pendentes do quiz (fire and forget pattern)
  useEffect(() => {
    if (quiz.pendingBadges.length > 0) {
      const badges = quiz.consumePendingBadges()
      badgeQueue.queueBadges(badges)
    }
  }, [quiz.pendingBadges, quiz.consumePendingBadges, badgeQueue])

  // 🔧 v16 FIX: Marca como completado quando quiz confirma
  useEffect(() => {
    if (quiz.completedNow && !wasAlreadyCompleted) {
      setWasAlreadyCompleted(true)
    }
  }, [quiz.completedNow, wasAlreadyCompleted])

  // Navega quando badges terminarem
  useEffect(() => {
    if (pendingNavigation && !quiz.isSaving && !badgeQueue.hasPendingBadges) {
      navigate(pendingNavigation)
    }
  }, [pendingNavigation, quiz.isSaving, badgeQueue.hasPendingBadges, navigate])

  // Reset quando muda de episódio
  useEffect(() => {
    hasLoadedProgress.current = false
    lastSaveTimeRef.current = 0
    setAudioTime(0)
    setLoadingProgress(true)
    setWasAlreadyCompleted(false)
    setShowQuiz(false)
    setPendingNavigation(null)
    quiz.fullReset()
    badgeQueue.clearQueue()
  }, [id, episodeId])

  // Carrega progresso
  useEffect(() => {
    async function loadProgress() {
      if (hasLoadedProgress.current) return
      
      if (!user || !episode) {
        setLoadingProgress(false)
        return
      }
      
      try {
        const progress = await getProgress(id, episodeId)
        hasLoadedProgress.current = true
        
        if (progress) {
          if (progress.completed) {
            setWasAlreadyCompleted(true)
          } else {
            quiz.loadProgress(progress)
            setAudioTime(progress.audioTime || 0)
            if ((progress.currentQuestion || 0) > 0) {
              setShowQuiz(true)
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar progresso:', err)
      } finally {
        setLoadingProgress(false)
      }
    }
    
    const timer = setTimeout(loadProgress, 50)
    return () => clearTimeout(timer)
  }, [user, id, episodeId, episode, getProgress])

  // ========== HANDLERS ==========

  const handleAnswer = async (index) => {
    await quiz.handleAnswer(index)
  }

  // 🔧 v16 FIX: Simplificado - badges vêm via useEffect agora
  const handleNextQuestion = () => {
    quiz.handleNextQuestion()
  }

  const handleNextEpisode = () => {
    const nextEpisode = series.episodes.find(ep => ep.id === episode.id + 1)
    const isLastEpisode = !nextEpisode
    const targetUrl = isLastEpisode ? '/' : `/series/${id}/episode/${nextEpisode.id}`
    
    quiz.closeFinalModal()
    
    if (quiz.isSaving || badgeQueue.hasPendingBadges) {
      setPendingNavigation(targetUrl)
    } else {
      navigate(targetUrl)
    }
  }

  // ========== EARLY RETURNS ==========

  if (!series || !episode) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
        <p className="text-[#1A1A1A]">Episódio não encontrado</p>
      </div>
    )
  }

  if (loadingProgress) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
        <p className="text-[#6B7280]">Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F0F0]">
        <Header showBack backTo={`/series/${id}`} />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <img 
            src={series.coverImage} 
            alt={series.title}
            className="w-32 h-32 object-cover rounded-xl mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{episode.title}</h1>
          <p className="text-[#6B7280] mb-6">Faça login para ouvir este episódio</p>
          <button
            onClick={() => document.querySelector('[data-login]')?.click()}
            className="bg-[#E50914] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#B20710] transition-colors"
          >
            Entrar para continuar
          </button>
        </main>
      </div>
    )
  }

  // Derived
  const nextEpisode = series.episodes.find(ep => ep.id === episode.id + 1)
  const isLastEpisode = !nextEpisode

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      {/* Modals */}
      <AnimatePresence>
        {quiz.showMiniModal && (
          <MiniModal 
            isCorrect={quiz.lastAnswerCorrect}
            onNext={handleNextQuestion}
            onRetry={quiz.retryQuestion}
          />
        )}
        {quiz.showFinalModal && (
          <FinalModal 
            score={quiz.finalScore}
            total={quiz.totalQuestions}
            xp={quiz.xpEarned}
            onNext={handleNextEpisode}
            onRestart={quiz.handleRestart}
            isLastEpisode={isLastEpisode}
            isSaving={quiz.isSaving}
          />
        )}
      </AnimatePresence>

      <Header showBack backTo={`/series/${id}`} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Audio Player */}
        <motion.div
          key={`${id}-${episodeId}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <AudioPlayer 
            audioUrl={episode.audioUrl} 
            coverImage={series.coverImage} 
            episodeTitle={episode.title}
            initialTime={audioTime}
            onTimeUpdate={handleTimeUpdate}
            transcript={episode.text}
            showQuiz={showQuiz}
            setShowQuiz={setShowQuiz}
            seriesId={id}
            episodeId={episodeId}
            wasAlreadyCompleted={wasAlreadyCompleted}
          />
        </motion.div>

        {/* Quiz */}
        <AnimatePresence>
          {showQuiz && (
            <QuizSection
              currentQuestion={quiz.currentQuestion}
              currentQuestionIndex={quiz.currentQuestionIndex}
              totalQuestions={quiz.totalQuestions}
              selectedAnswer={quiz.selectedAnswer}
              lastAnswerCorrect={quiz.lastAnswerCorrect}
              onAnswer={handleAnswer}
              disabled={quiz.isProcessingAnswer}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Badge Celebration */}
      <BadgeCelebrationModal 
        badge={badgeQueue.activeBadge} 
        onComplete={badgeQueue.completeBadge} 
      />

      {/* Tour */}
      <OnboardingTour 
        steps={EPISODE_TOUR_STEPS}
        isActive={showTour}
        currentStep={tourStep}
        onStepChange={setTourStep}
        onComplete={() => setShowTour(false)}
      />
    </div>
  )
}