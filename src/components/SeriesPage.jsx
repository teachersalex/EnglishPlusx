import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { seriesData } from '../data/series'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'

function SeriesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, getProgress } = useAuth()
  const [completedEpisodes, setCompletedEpisodes] = useState({})
  const [loading, setLoading] = useState(true)
  
  const series = seriesData[id]

  // Carrega progresso de todos os episódios
  useEffect(() => {
    async function loadAllProgress() {
      if (!user || !series) {
        setLoading(false)
        return
      }

      const completed = {}
      for (const ep of series.episodes) {
        const progress = await getProgress(id, ep.id.toString())
        if (progress?.completed) {
          completed[ep.id] = true
        }
      }
      setCompletedEpisodes(completed)
      setLoading(false)
    }

    loadAllProgress()
  }, [user, id, series])

  if (!series) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
        <p className="text-[#1A1A1A]">Série não encontrada</p>
      </div>
    )
  }

  const handleEpisodeClick = (episodeId) => {
    navigate(`/series/${id}/episode/${episodeId}`)
  }

  const completedCount = Object.keys(completedEpisodes).length
  const totalEpisodes = series.episodes.length

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Header showBack backTo="/" />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero da série */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A1A] rounded-2xl p-8 mb-8 text-white shadow-xl flex gap-6"
        >
          <img 
            src={series.coverImage} 
            alt={series.title}
            className="w-32 h-32 object-cover rounded-xl"
          />
          <div className="flex-1">
            <span className="text-[#E50914] text-sm font-bold">NÍVEL {series.level}</span>
            <h1 className="text-3xl font-bold mt-1">{series.title}</h1>
            <p className="text-white/70 mt-2">{series.description}</p>
            <p className="text-white/50 text-sm mt-2">{series.episodes.length} episódios • {series.genre}</p>
            
            {/* Barra de progresso da série */}
            {user && !loading && completedCount > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span>Progresso</span>
                  <span>{completedCount}/{totalEpisodes}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / totalEpisodes) * 100}%` }}
                    className="h-full bg-[#22C55E] rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Lista de episódios */}
        <h2 className="text-[#1A1A1A] text-xl font-bold mb-4">Episódios</h2>
        <div className="space-y-3">
          {series.episodes.map((ep, index) => {
            const isCompleted = completedEpisodes[ep.id]
            
            return (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleEpisodeClick(ep.id)}
                className={`bg-white rounded-xl p-4 shadow-md flex justify-between items-center cursor-pointer hover:shadow-lg transition-shadow ${
                  isCompleted ? 'border-l-4 border-[#22C55E]' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isCompleted 
                      ? 'bg-[#22C55E] text-white' 
                      : 'bg-[#E50914] text-white'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      ep.id
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A]">{ep.title}</h3>
                    <p className="text-[#6B7280] text-sm">
                      {ep.duration}
                      {isCompleted && <span className="text-[#22C55E] ml-2">• Completo</span>}
                    </p>
                  </div>
                </div>
                
                {isCompleted ? (
                  <span className="text-[#6B7280] text-sm">Rever</span>
                ) : (
                  <svg className="w-6 h-6 text-[#E50914]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </motion.div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default SeriesPage