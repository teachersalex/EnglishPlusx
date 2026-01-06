import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { seriesData } from '../data/series'
import { useAuth } from '../contexts/AuthContext'
import MiniModal from './modals/MiniModal'
import FinalModal from './modals/FinalModal'
import BadgeCelebrationModal from './modals/BadgeCelebrationModal'
import Header from './Header'
import AudioPlayer from './AudioPlayer'
import OnboardingTour from './OnboardingTour'
import { OnboardingStorage } from '../utils/onboardingStorage'
import { TUTORIAL_SERIES_ID } from '../constants'

// Steps do tour no EpisodePage
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

function EpisodePage() {
  const { id, episodeId } = useParams()
  const navigate = useNavigate()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const [showMiniModal, setShowMiniModal] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [showFinalModal, setShowFinalModal] = useState(false)
  const [audioTime, setAudioTime] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(true)
  
  const [isSaving, setIsSaving] = useState(false)
  
  const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  
  const [badgeQueue, setBadgeQueue] = useState([]) 
  const [activeBadge, setActiveBadge] = useState(null)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  
  // Tour state
  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  
  // Refs para controle
  const hasLoadedProgress = useRef(false)
  const lastSaveTimeRef = useRef(0) // THROTTLE: controla último save do áudio
  
  const { user, updateUserXP, saveProgress, getProgress, updateStreak, saveQuizScore } = useAuth()

  const series = seriesData[id]
  const episode = series?.episodes.find(ep => ep.id === parseInt(episodeId))
  const totalQuestions = episode?.questions.length || 0
  
  const isTutorial = parseInt(id, 10) === TUTORIAL_SERIES_ID

  // Ativa tour se estiver no passo 'episode'
  useEffect(() => {
    if (isTutorial && OnboardingStorage.getStep() === 'episode') {
      const timer = setTimeout(() => setShowTour(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isTutorial])

  // Processa fila de badges
  useEffect(() => {
    if (!activeBadge && !showMiniModal && !showFinalModal && badgeQueue.length > 0) {
      const [nextBadge, ...rest] = badgeQueue
      setActiveBadge(nextBadge)
      setBadgeQueue(rest)
    }
  }, [activeBadge, showMiniModal, showFinalModal, badgeQueue])

  // Navega quando badges terminarem
  useEffect(() => {
    if (pendingNavigation && !isSaving && badgeQueue.length === 0 && !activeBadge) {
      navigate(pendingNavigation)
    }
  }, [pendingNavigation, isSaving, badgeQueue, activeBadge, navigate])

  const queueBadge = (badge) => {
    if (badge && typeof badge === 'string') {
      setBadgeQueue(prev => [...prev, badge])
    }
  }

  // Reset quando muda de episódio
  useEffect(() => {
    hasLoadedProgress.current = false
    lastSaveTimeRef.current = 0
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    scoreRef.current = 0
    setShowMiniModal(false)
    setShowFinalModal(false)
    setAudioTime(0)
    setLoadingProgress(true)
    setLastAnswerCorrect(false)
    setShowQuiz(false)
    setWasAlreadyCompleted(false)
    setBadgeQueue([])
    setActiveBadge(null)
    setPendingNavigation(null)
    setIsSaving(false)
  }, [id, episodeId])

  // Carrega progresso (UMA VEZ por episódio)
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
            setCurrentQuestionIndex(progress.currentQuestion || 0)
            const loadedScore = progress.score || 0
            setScore(loadedScore)
            scoreRef.current = loadedScore
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

  const currentQuestion = episode.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  // THROTTLE: Salva progresso do áudio no máximo a cada 8 segundos
  const handleTimeUpdate = (time) => {
    if (!user) return
    setAudioTime(time)
    
    const now = Date.now()
    if (now - lastSaveTimeRef.current < 8000) return // Ignora se < 8s desde último save
    lastSaveTimeRef.current = now
    
    saveProgress(id, episodeId, {
      audioTime: time,
      currentQuestion: currentQuestionIndex,
      questionsAnswered: currentQuestionIndex,
      score: scoreRef.current,
      completed: wasAlreadyCompleted,
      seriesTitle: series.title,
      episodeTitle: episode.title,
      coverImage: series.coverImage
    }).catch(err => console.error('Erro ao salvar progresso:', err))
  }

  const handleAnswer = async (index) => {
    // Guarda contra cliques duplicados
    if (selectedAnswer !== null || isSaving) return
    
    setSelectedAnswer(index)
    const isCorrect = index === currentQuestion.correctAnswer
    setLastAnswerCorrect(isCorrect)
    
    if (isCorrect) {
      const newScore = scoreRef.current + 1
      scoreRef.current = newScore
      setScore(newScore)
      
      // ANTI-FARM: Só dá XP se episódio NÃO foi completado antes
      if (user && !wasAlreadyCompleted) {
        updateUserXP(10)
          .then(badgeXP => { if (badgeXP) queueBadge(badgeXP) })
          .catch(err => console.error('Erro ao dar XP:', err))

        saveProgress(id, episodeId, {
          audioTime,
          currentQuestion: currentQuestionIndex,
          questionsAnswered: currentQuestionIndex + 1,
          score: newScore,
          completed: false,
          seriesTitle: series.title,
          episodeTitle: episode.title,
          coverImage: series.coverImage
        }).catch(err => console.error('Erro ao salvar progresso:', err))
      }
    }

    // ANTI-FARM: Só atualiza streak se episódio NÃO foi completado antes
    if (user && !wasAlreadyCompleted) {
      updateStreak()
        .then(badgeStreak => { if (badgeStreak) queueBadge(badgeStreak) })
        .catch(err => console.error('Erro ao atualizar streak:', err))
    }

    setShowMiniModal(true)
  }

  const handleNextQuestion = () => {
    setShowMiniModal(false)
    
    if (isLastQuestion) {
      if (user) {
        setIsSaving(true)
        
        const finalQuizScore = scoreRef.current
        const isQuizPerfect = finalQuizScore === totalQuestions
        
        saveProgress(id, episodeId, {
          audioTime,
          currentQuestion: totalQuestions,
          questionsAnswered: totalQuestions,
          score: finalQuizScore,
          completed: true,
          seriesTitle: series.title,
          episodeTitle: episode.title,
          coverImage: series.coverImage
        })
          .then(async (badgeCompletion) => {
            if (badgeCompletion) queueBadge(badgeCompletion)
            
            // ANTI-FARM: Só checa quiz perfeito se NÃO era completado antes
            if (isQuizPerfect && saveQuizScore && !wasAlreadyCompleted) {
              const quizBadge = await saveQuizScore(id, episodeId, finalQuizScore, totalQuestions)
              if (quizBadge) queueBadge(quizBadge)
            }
          })
          .catch(err => console.error('Erro ao salvar progresso final:', err))
          .finally(() => setIsSaving(false))
        
        setWasAlreadyCompleted(true)
      }
      // Modal aparece IMEDIATAMENTE, botão mostra "Salvando..."
      setShowFinalModal(true)
    } else {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setSelectedAnswer(null)
      
      if (user) {
        saveProgress(id, episodeId, {
          audioTime,
          currentQuestion: nextIndex,
          questionsAnswered: nextIndex,
          score: scoreRef.current,
          completed: wasAlreadyCompleted,
          seriesTitle: series.title,
          episodeTitle: episode.title,
          coverImage: series.coverImage
        }).catch(err => console.error('Erro ao salvar progresso:', err))
      }
    }
  }

  const nextEpisode = series.episodes.find(ep => ep.id === episode.id + 1)
  const isLastEpisode = !nextEpisode

  const handleNextEpisode = () => {
    const targetUrl = isLastEpisode ? '/' : `/series/${id}/episode/${nextEpisode.id}`
    setShowFinalModal(false)
    
    if (isSaving || badgeQueue.length > 0 || activeBadge) {
      setPendingNavigation(targetUrl)
    } else {
      navigate(targetUrl)
    }
  }

  const handleBadgeComplete = () => {
    setActiveBadge(null)
  }

  const handleTourComplete = () => {
    setShowTour(false)
  }

  const handleTourStepChange = (newStep) => {
    setTourStep(newStep)
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <AnimatePresence>
        {showMiniModal && (
          <MiniModal 
            isCorrect={lastAnswerCorrect}
            onNext={handleNextQuestion}
            onRetry={() => {
              setShowMiniModal(false)
              setSelectedAnswer(null)
            }}
          />
        )}
        {showFinalModal && (
          <FinalModal 
            score={scoreRef.current}
            total={totalQuestions}
            xp={scoreRef.current * 10}
            onNext={handleNextEpisode}
            onRestart={() => {
              setShowFinalModal(false)
              setCurrentQuestionIndex(0)
              setSelectedAnswer(null)
              setScore(0)
              scoreRef.current = 0
              setPendingNavigation(null)
            }}
            isLastEpisode={isLastEpisode}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>

      <Header showBack backTo={`/series/${id}`} />

      <main className="max-w-3xl mx-auto px-4 py-8">
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

        <AnimatePresence>
          {showQuiz && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              data-tour="quiz-area"
            >
              <div className="mb-4 flex items-center gap-2 px-2">
                <span className="text-[#6B7280] text-sm">Pergunta {currentQuestionIndex + 1} de {totalQuestions}</span>
                <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-sm">
                  {episode.questions.map((_, idx) => (
                    <motion.div
                      key={idx}
                      className={`inline-block h-full ${idx <= currentQuestionIndex ? 'bg-[#E50914]' : 'bg-[#E5E5E5]'}`}
                      style={{ width: `${100 / totalQuestions}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-[#000000]/5 mb-8">
                <h2 className="text-[#E50914] text-sm font-bold mb-2">QUIZ</h2>
                <h3 className="text-[#1A1A1A] text-xl font-bold mb-6">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index
                    const showResult = selectedAnswer !== null
                    const isCorrectAnswer = index === currentQuestion.correctAnswer
                    
                    let styles = "bg-[#F5F5F5] text-[#1A1A1A] border-2 border-transparent"
                    let icon = null

                    if (showResult) {
                      if (isSelected) {
                        if (lastAnswerCorrect) {
                          styles = "bg-[#22C55E]/10 border-[#22C55E] text-[#15803d]"
                          icon = (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><svg className="w-6 h-6 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></motion.div>)
                        } else {
                          styles = "bg-[#EF4444]/10 border-[#EF4444] text-[#B91C1C]"
                          icon = (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><svg className="w-6 h-6 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></motion.div>)
                        }
                      } else if (isCorrectAnswer && !lastAnswerCorrect) {
                        styles = "bg-white border-[#22C55E]/30 opacity-60" 
                      } else {
                        styles = "bg-[#F5F5F5] opacity-50"
                      }
                    } else {
                      styles = "bg-[#F5F5F5] hover:bg-[#EAEAEA] hover:border-[#D4D4D4] cursor-pointer"
                    }

                    return (
                      <motion.button
                        key={index}
                        whileHover={!showResult ? { scale: 1.01, y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" } : {}}
                        whileTap={!showResult ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(index)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-4 rounded-xl text-left font-medium transition-all flex justify-between items-center ${styles}`}
                      >
                        <span>{option}</span>
                        {icon}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BadgeCelebrationModal 
        badge={activeBadge} 
        onComplete={handleBadgeComplete} 
      />

      {/* Tour guiado */}
      <OnboardingTour 
        steps={EPISODE_TOUR_STEPS}
        isActive={showTour}
        currentStep={tourStep}
        onStepChange={handleTourStepChange}
        onComplete={handleTourComplete}
      />
    </div>
  )
}

export default EpisodePage