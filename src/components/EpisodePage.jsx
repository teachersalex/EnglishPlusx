import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { seriesData } from '../data/series'
import { useAuth } from '../contexts/AuthContext'
import MiniModal from './modals/MiniModal'
import FinalModal from './modals/FinalModal'
import Header from './Header'
import LoginModal from './LoginModal'


function AudioPlayer({ audioUrl, coverImage, episodeTitle, initialTime, onTimeUpdate }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  const speeds = [0.5, 0.75, 1, 1.25, 1.5]

  // Seta tempo inicial quando carrega
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoaded = () => {
      setDuration(audio.duration)
      if (initialTime && initialTime > 0) {
        audio.currentTime = initialTime
      }
    }

    audio.addEventListener('loadedmetadata', handleLoaded)
    return () => audio.removeEventListener('loadedmetadata', handleLoaded)
  }, [initialTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
    }
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Salva tempo a cada 10 segundos
  useEffect(() => {
    if (!onTimeUpdate) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        onTimeUpdate(audioRef.current.currentTime)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [onTimeUpdate])

  // Salva tempo ao pausar
  const handlePause = () => {
    if (onTimeUpdate && audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
      handlePause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skip = (seconds) => {
    audioRef.current.currentTime += seconds
  }

  const changeSpeed = (speed) => {
    setPlaybackRate(speed)
    audioRef.current.playbackRate = speed
  }

  const handleProgressClick = (e) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Capa */}
      <div className="mb-6">
        <img 
          src={coverImage} 
          alt={episodeTitle}
          className="w-full h-48 object-cover rounded-xl"
        />
        <p className="text-white font-bold text-center mt-3">{episodeTitle}</p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div 
          className="h-2 bg-white/20 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-2 bg-[#E50914] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-white/50 text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles principais */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Voltar 5s */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(-5)}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <span className="text-xs font-bold">-5s</span>
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white text-2xl hover:bg-[#B20710] transition-colors shadow-lg"
        >
          {isPlaying ? (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
) : (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
)}
        </motion.button>

        {/* Avançar 5s */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(5)}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <span className="text-xs font-bold">+5s</span>
        </motion.button>
      </div>

      {/* Velocidades */}
      <div className="flex items-center justify-center gap-2">
        {speeds.map((speed) => (
          <motion.button
            key={speed}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              playbackRate === speed
                ? 'bg-[#E50914] text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>

      <p className="text-white/50 text-center text-sm mt-4">
        🎧 Ouça com atenção
      </p>
    </div>
  )
}

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

  // RESETA TUDO quando muda de episódio, ANTES de carregar progresso
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
      
      // Só carrega se NÃO estiver completo
      if (progress && !progress.completed) {
        setCurrentQuestionIndex(progress.currentQuestion || 0)
        setScore(progress.score || 0)
        setAudioTime(progress.audioTime || 0)
      }
      // Se completo, mantém os valores zerados do reset
      
      setLoadingProgress(false)
    }
    
    // Pequeno delay pra garantir que o reset rodou
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

  // Salva tempo do áudio
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
      {/* Modals */}
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
        {/* Player de áudio - KEY força remontagem */}
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