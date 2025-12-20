import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { seriesData } from '../data/series' //
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

  const series = seriesData[id] //
  const episode = series?.episodes.find(ep => ep.id === parseInt(episodeId))
  const totalQuestions = episode?.questions.length || 0

  useEffect(() => {
    setCurrentQuestionIndex(0); setSelectedAnswer(null); setScore(0); setShowMiniModal(false); setShowFinalModal(false); setAudioTime(0); setLoadingProgress(true); setLastAnswerCorrect(false);
  }, [id, episodeId])

  useEffect(() => {
    async function loadProgress() {
      if (!user || !episode) { setLoadingProgress(false); return; }
      const progress = await getProgress(id, episodeId)
      if (progress && !progress.completed) {
        if (progress.currentQuestion < totalQuestions) setCurrentQuestionIndex(progress.currentQuestion || 0)
        setScore(progress.score || 0)
        setAudioTime(progress.audioTime || 0)
      }
      setLoadingProgress(false)
    }
    const timer = setTimeout(loadProgress, 50)
    return () => clearTimeout(timer)
  }, [user, id, episodeId, episode])

  if (!series || !episode) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Episódio não encontrado</div>
  if (loadingProgress) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Carregando...</div>

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212]">
        <Header showBack backTo={`/series/${id}`} />
        <main className="max-w-md mx-auto px-4 py-16 text-center text-white">
          <img src={series.coverImage} alt={series.title} className="w-32 h-32 object-cover rounded-xl mx-auto mb-6 shadow-2xl breathing-cover" />
          <h1 className="text-2xl font-bold mb-2">{episode.title}</h1>
          <p className="text-white/60 mb-6">Faça login para continuar sua jornada.</p>
          <button onClick={() => document.querySelector('[data-login]')?.click()} className="bg-[#E50914] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#B20710] transition-colors btn-shine">Entrar Agora</button>
        </main>
      </div>
    )
  }

  const currentQuestion = episode.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  const handleTimeUpdate = (time) => {
    setAudioTime(time)
    saveProgress(id, episodeId, { audioTime: time, currentQuestion: currentQuestionIndex, questionsAnswered: currentQuestionIndex, score, completed: false, seriesTitle: series.title, episodeTitle: episode.title, coverImage: series.coverImage })
  }

  const handleAnswer = async (index) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    const isCorrect = index === currentQuestion.correctAnswer
    setLastAnswerCorrect(isCorrect)
    if (isCorrect) { const newScore = score + 1; setScore(newScore); updateUserXP(10); }
    setShowMiniModal(true)
  }

  const handleNextQuestion = async () => {
    setShowMiniModal(false)
    if (isLastQuestion) {
      saveProgress(id, episodeId, { audioTime, currentQuestion: totalQuestions, questionsAnswered: totalQuestions, score, completed: true, seriesTitle: series.title, episodeTitle: episode.title, coverImage: series.coverImage })
      setShowFinalModal(true)
    } else {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setSelectedAnswer(null)
      saveProgress(id, episodeId, { audioTime, currentQuestion: nextIndex, questionsAnswered: nextIndex, score, completed: false, seriesTitle: series.title, episodeTitle: episode.title, coverImage: series.coverImage })
    }
  }

  const nextEpisode = series.episodes.find(ep => ep.id === episode.id + 1)
  const isLastEpisode = !nextEpisode
  const handleNextEpisode = () => { isLastEpisode ? navigate('/') : navigate(`/series/${id}/episode/${nextEpisode.id}`) }

  return (
    <div className="min-h-screen bg-[#121212] pb-10">
      <AnimatePresence>
        {showMiniModal && <MiniModal isCorrect={lastAnswerCorrect} onNext={handleNextQuestion} onRetry={() => { setShowMiniModal(false); setSelectedAnswer(null); }} />}
        {showFinalModal && <FinalModal score={score} total={totalQuestions} xp={score * 10} onNext={handleNextEpisode} onRestart={() => { setShowFinalModal(false); setCurrentQuestionIndex(0); setSelectedAnswer(null); setScore(0); }} isLastEpisode={isLastEpisode} />}
      </AnimatePresence>
      <Header showBack backTo={`/series/${id}`} />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <AudioPlayer
          audioUrl={episode.audioUrl}
          coverImage={series.coverImage}
          episodeTitle={episode.title}
          initialTime={audioTime}
          onTimeUpdate={handleTimeUpdate}
          transcript={episode.text}
          quizData={{ currentQuestion, currentQuestionIndex, totalQuestions, selectedAnswer, handleAnswer, lastAnswerCorrect }}
        />
      </main>
    </div>
  )
}

export default EpisodePage