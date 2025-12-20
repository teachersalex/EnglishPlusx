import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { seriesData, seriesByLevel } from '../data/series'
import Header from './Header'
import UserStats from './UserStats'
import { useAuth } from '../contexts/AuthContext'

function SeriesCard({ series, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer min-w-[160px]"
    >
      <div className="h-32 overflow-hidden">
        <img 
          src={series.coverImage} 
          alt={series.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <h3 className="font-bold text-[#1A1A1A] text-sm truncate">{series.title}</h3>
        <p className="text-[#6B7280] text-xs mt-1">{series.episodes.length} episódios</p>
      </div>
    </motion.div>
  )
}

function SeriesRow({ title, series, onSeriesClick }) {
  if (series.length === 0) return null
  
  return (
    <div className="mb-8">
      <h2 className="text-[#1A1A1A] text-xl font-bold mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {series.map(s => (
          <SeriesCard key={s.id} series={s} onClick={() => onSeriesClick(s.id)} />
        ))}
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { user, userData, getLastProgress } = useAuth()
  const [continueEpisode, setContinueEpisode] = useState(null)

  // Carrega último progresso ao montar
  useEffect(() => {
    async function loadContinue() {
      if (!user) return
      
      const lastProgress = await getLastProgress()
      
      // Só mostra se não estiver completo
      if (lastProgress && !lastProgress.completed) {
        const series = seriesData[lastProgress.seriesId]
        const totalQuestions = series?.episodes.find(
          ep => ep.id === parseInt(lastProgress.episodeId)
        )?.questions.length || 3
        
        setContinueEpisode({
          url: `/series/${lastProgress.seriesId}/episode/${lastProgress.episodeId}`,
          coverImage: lastProgress.coverImage,
          seriesTitle: lastProgress.seriesTitle,
          episodeTitle: lastProgress.episodeTitle,
          progress: Math.round((lastProgress.questionsAnswered / totalQuestions) * 100),
          questionsAnswered: lastProgress.questionsAnswered || 0,
          totalQuestions
        })
      } else {
        setContinueEpisode(null)
      }
    }
    
    loadContinue()
  }, [user, getLastProgress])

  const handleSeriesClick = (id) => {
    navigate(`/series/${id}`)
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Se estiver logado, mostra stats + botão admin (dentro do componente) */}
        {user && <UserStats user={userData} continueEpisode={continueEpisode} />}
        
        {/* Se NÃO estiver logado, mostra boas vindas */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Aprenda inglês com histórias imersivas
            </h1>
            <p className="text-[#6B7280] mb-6">Faça login para acompanhar seu progresso</p>
            <button
              onClick={() => document.querySelector('[data-login]')?.click()}
              className="bg-[#E50914] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#B20710] transition-colors"
            >
              Começar grátis
            </button>
          </motion.div>
        )}

        {/* Listas de Séries */}
        <SeriesRow title="Starter — Pré-A1" series={seriesByLevel.starter} onSeriesClick={handleSeriesClick} />
        <SeriesRow title="Nível A1 — Iniciante" series={seriesByLevel.a1} onSeriesClick={handleSeriesClick} />
        <SeriesRow title="Nível A2 — Básico" series={seriesByLevel.a2} onSeriesClick={handleSeriesClick} />
      </main>
    </div>
  )
}

export default Home