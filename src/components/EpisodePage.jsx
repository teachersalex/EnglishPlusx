import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { seriesData } from '../data/series'
import { useAuth } from '../contexts/AuthContext'
import MiniModal from './modals/MiniModal'
import FinalModal from './modals/FinalModal'
import BadgeCelebrationModal from './modals/BadgeCelebrationModal'
import Header from './Header'
import AudioPlayer from './AudioPlayer'

function EpisodePage() {
  const { id, episodeId } = useParams()
  const navigate = useNavigate()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [showMiniModal, setShowMiniModal] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [showFinalModal, setShowFinalModal] = useState(false)
  const [audioTime, setAudioTime] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(true)
  
  // Trava para evitar navegação durante save
  const [isSaving, setIsSaving] = useState(false)
  
  const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  
  const [badgeQueue, setBadgeQueue] = useState([]) 
  const [activeBadge, setActiveBadge] = useState(null)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  
  const { user, updateUserXP, saveProgress, getProgress, updateStreak } = useAuth()

  const series = seriesData[id]
  const episode = series?.episodes.find(ep => ep.id === parseInt(episodeId))
  const totalQuestions = episode?.questions.length || 0

  useEffect(() => {
    if (!activeBadge && !showMiniModal && !showFinalModal && badgeQueue.length > 0) {
      const [nextBadge, ...rest] = badgeQueue
      setActiveBadge(nextBadge)
      setBadgeQueue(rest)
    }
  }, [activeBadge, showMiniModal, showFinalModal, badgeQueue])

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

  useEffect(() => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
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

  useEffect(() => {
    async function loadProgress() {
      if (!user || !episode) {
        setLoadingProgress(false)
        return
      }
      
      const progress = await getProgress(id, episodeId)
      
      if (progress) {
        if (progress.completed) {
          setWasAlreadyCompleted(true)
        } else {
          setCurrentQuestionIndex(progress.currentQuestion || 0)
          setScore(progress.score || 0)
          setAudioTime(progress.audioTime || 0)
          if ((progress.currentQuestion || 0) > 0) {
            setShowQuiz(true)
          }
        }
      }
      setLoadingProgress(false)
    }
    
    const timer = setTimeout(loadProgress, 50)
    return () => clearTimeout(timer)
  }, [user, id, episodeId, episode])

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

  const handleTimeUpdate = (time) => {
    if (!user) return
    setAudioTime(time)
    saveProgress(id, episodeId, {
      audioTime: time,
      currentQuestion: currentQuestionIndex,
      questionsAnswered: currentQuestionIndex,
      score,
      completed: wasAlreadyCompleted,
      seriesTitle: series.title,
      episodeTitle: episode.title,
      coverImage: series.coverImage
    })
  }

  const handleAnswer = async (index) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    const isCorrect = index === currentQuestion.correctAnswer
    setLastAnswerCorrect(isCorrect)
    
    if (isCorrect) {
      const newScore = score + 1
      setScore(newScore)
      if (user) {
        updateUserXP(10).then(badgeXP => { if (badgeXP) queueBadge(badgeXP) })

        saveProgress(id, episodeId, {
          audioTime,
          currentQuestion: currentQuestionIndex,
          questionsAnswered: currentQuestionIndex + 1,
          score: newScore,
          completed: wasAlreadyCompleted,
          seriesTitle: series.title,
          episodeTitle: episode.title,
          coverImage: series.coverImage
        })
      }
    }

    if (user) {
      updateStreak().then(badgeStreak => { if (badgeStreak) queueBadge(badgeStreak) })
    }

    setShowMiniModal(true)
  }

  const handleNextQuestion = () => {
    setShowMiniModal(false)
    
    if (isLastQuestion) {
      if (user) {
        // Marca salvamento
        setIsSaving(true)
        
        saveProgress(id, episodeId, {
          audioTime,
          currentQuestion: totalQuestions,
          questionsAnswered: totalQuestions,
          score,
          completed: true,
          seriesTitle: series.title,
          episodeTitle: episode.title,
          coverImage: series.coverImage
        }).then(badgeCompletion => {
          if (badgeCompletion) queueBadge(badgeCompletion)
          setIsSaving(false)
        })
        
        setWasAlreadyCompleted(true)
      }
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
          score,
          completed: wasAlreadyCompleted,
          seriesTitle: series.title,
          episodeTitle: episode.title,
          coverImage: series.coverImage
        })
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
            score={score}
            total={totalQuestions}
            xp={score * 10}
            onNext={handleNextEpisode}
            onRestart={() => {
              setShowFinalModal(false)
              setCurrentQuestionIndex(0)
              setSelectedAnswer(null)
              setScore(0)
              setPendingNavigation(null)
            }}
            isLastEpisode={isLastEpisode}
            isSaving={isSaving} // [NOVO] Passa o estado de salvamento
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
          />
        </motion.div>

        <AnimatePresence>
          {showQuiz && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
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
    </div>
  )
}

export default EpisodePage