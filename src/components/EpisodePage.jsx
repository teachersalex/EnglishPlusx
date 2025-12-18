import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { seriesData } from '../data/series'
import { useAuth } from '../contexts/AuthContext'
import MiniModal from './modals/MiniModal'
import FinalModal from './modals/FinalModal'
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
  
  const { user, updateUserXP, saveProgress, getProgress } = useAuth()

  const series = seriesData[id]
  const episode = series?.episodes.find(ep => ep.id === parseInt(episodeId))
  const totalQuestions = episode?.questions.length || 0

  // RESETA TUDO quando muda de episódio
  useEffect(() => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setShowMiniModal(false)
    setShowFinalModal(false)
    setAudioTime(0)
    setLoadingProgress(true)
    setLastAnswerCorrect(false)
  }, [id, episodeId])

  // Carrega progresso DEPOIS de resetar
  useEffect(() => {
    async function loadProgress() {
      if (!user || !episode) {
        setLoadingProgress(false)
        return
      }
      
      const progress = await getProgress(id, episodeId)
      
      if (progress && !progress.completed) {
        setCurrentQuestionIndex(progress.currentQuestion || 0)
        setScore(progress.score || 0)
        setAudioTime(progress.audioTime || 0)
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

  // Bloqueio para não logados
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
      completed: false,
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
        updateUserXP(10)
        saveProgress(id, episodeId, {
          audioTime,
          currentQuestion: currentQuestionIndex,
          questionsAnswered: currentQuestionIndex + 1,
          score: newScore,
          completed: false,
          seriesTitle: series.title,
          episodeTitle: episode.title,
          coverImage: series.coverImage
        })
      }
    }
    
    setShowMiniModal(true)
  }

  const handleNextQuestion = async () => {
    setShowMiniModal(false)
    
    if (isLastQuestion) {
      if (user) {
        saveProgress(id, episodeId, {
          audioTime,
          currentQuestion: totalQuestions,
          questionsAnswered: totalQuestions,
          score,
          completed: true,
          seriesTitle: series.title,
          episodeTitle: episode.title,
          coverImage: series.coverImage
        })
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
          completed: false,
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
    if (isLastEpisode) {
      navigate('/')
    } else {
      navigate(`/series/${id}/episode/${nextEpisode.id}`)
    }
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
            }}
            isLastEpisode={isLastEpisode}
          />
        )}
      </AnimatePresence>

      <Header showBack backTo={`/series/${id}`} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Player de áudio */}
        <motion.div
          key={`${id}-${episodeId}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <AudioPlayer 
            audioUrl={episode.audioUrl} 
            coverImage={series.coverImage} 
            episodeTitle={episode.title}
            initialTime={audioTime}
            onTimeUpdate={handleTimeUpdate}
            transcript={episode.text}
          />
        </motion.div>

        {/* Progresso do Quiz */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[#6B7280] text-sm">Pergunta {currentQuestionIndex + 1} de {totalQuestions}</span>
          <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
            {episode.questions.map((_, idx) => (
              <motion.div
                key={idx}
                className={`inline-block h-full ${idx <= currentQuestionIndex ? 'bg-[#E50914]' : 'bg-[#E5E5E5]'}`}
                style={{ width: `${100 / totalQuestions}%` }}
              />
            ))}
          </div>
        </div>

        {/* Quiz */}
        <motion.div
          key={`quiz-${currentQuestionIndex}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-[#E50914] text-sm font-bold mb-2">QUIZ</h2>
          <h3 className="text-[#1A1A1A] text-xl font-bold mb-6">{currentQuestion.question}</h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let styles = "bg-[#F0F0F0] hover:bg-[#E5E5E5]"
              
              if (selectedAnswer !== null) {
                if (index === selectedAnswer) {
                  if (lastAnswerCorrect) {
                    styles = "bg-[#22C55E] text-white"
                  } else {
                    styles = "bg-[#EF4444] text-white"
                  }
                }
              }

              return (
                <motion.button
                  key={index}
                  whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                  whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl text-left font-medium transition-all ${styles}`}
                >
                  {option}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default EpisodePage