import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { seriesData } from '../data/series'
import Header from './Header'

function SeriesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const series = seriesData[id]

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

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      {/* Header */}
<Header showBack backTo="/" />

      {/* Conteúdo */}
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
          <div>
            <span className="text-[#E50914] text-sm font-bold">NÍVEL {series.level}</span>
            <h1 className="text-3xl font-bold mt-1">{series.title}</h1>
            <p className="text-white/70 mt-2">{series.description}</p>
            <p className="text-white/50 text-sm mt-2">{series.episodes.length} episódios • {series.genre}</p>
          </div>
        </motion.div>

        {/* Lista de episódios */}
        <h2 className="text-[#1A1A1A] text-xl font-bold mb-4">Episódios</h2>
        <div className="space-y-3">
          {series.episodes.map((ep, index) => (
            <motion.div
              key={ep.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleEpisodeClick(ep.id)}
              className="bg-white rounded-xl p-4 shadow-md flex justify-between items-center cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#E50914] rounded-full flex items-center justify-center text-white font-bold">
                  {ep.id}
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A1A]">{ep.title}</h3>
                  <p className="text-[#6B7280] text-sm">{ep.duration}</p>
                </div>
              </div>
              <span className="text-[#E50914] text-2xl">▶</span>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default SeriesPage