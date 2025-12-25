import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { seriesData, seriesByLevel } from '../data/series'
import Header from './Header'
import UserStats from './UserStats'
import { useAuth } from '../contexts/AuthContext'

/**
 * Card da Série com Hierarquia Visual:
 * 1. DIAMANTE (Platina) = Média > 95%
 * 2. OURO (Concluído) = Terminou todos os episódios
 * 3. NORMAL = Em andamento ou não iniciado
 */
function SeriesCard({ series, onClick, hasDiamond, isCompleted }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer min-w-[160px] relative group"
    >
      {/* BADGE DE STATUS (Canto Superior Direito) */}
      {hasDiamond ? (
        // NÍVEL PLATINA (Diamante)
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-2 right-2 z-10"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
            <span className="text-white text-sm filter drop-shadow-md">💎</span>
          </div>
        </motion.div>
      ) : isCompleted ? (
        // NÍVEL OURO (Concluído - A "base" que valoriza o esforço)
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 z-10"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/30 ring-2 ring-white/20">
            <svg className="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </motion.div>
      ) : null}
      
      {/* Imagem da Capa */}
      <div className="h-32 overflow-hidden relative">
        <img 
          src={series.coverImage} 
          alt={series.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* OVERLAYS VISUAIS (Brilho na capa) */}
        {hasDiamond && (
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/40 via-blue-400/10 to-transparent mix-blend-overlay" />
        )}
        {!hasDiamond && isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 via-yellow-300/10 to-transparent mix-blend-overlay" />
        )}
      </div>
      
      {/* Informações */}
      <div className="p-3 bg-white relative">
        {/* Barra de status sutil no topo do card body */}
        {hasDiamond ? (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500" />
        ) : isCompleted ? (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
        ) : null}

        <h3 className={`font-bold text-sm truncate ${
          hasDiamond ? 'text-blue-600' : isCompleted ? 'text-yellow-700' : 'text-[#1A1A1A]'
        }`}>
          {series.title}
        </h3>
        
        <p className="text-[#6B7280] text-xs mt-1 flex items-center gap-1">
          {series.episodes.length} episódios
          {hasDiamond && <span className="text-blue-400 font-bold">• Platina</span>}
          {!hasDiamond && isCompleted && <span className="text-yellow-500 font-bold">• Completo</span>}
        </p>
      </div>
    </motion.div>
  )
}

function SeriesRow({ title, series, onSeriesClick, diamondSeries, completedSeriesIds }) {
  // Proteção: se a série não existir ou estiver vazia, não renderiza nada
  if (!series || series.length === 0) return null
  
  return (
    <div className="mb-8">
      <h2 className="text-[#1A1A1A] text-xl font-bold mb-4 flex items-center gap-2">
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
        {series.map(s => (
          <SeriesCard 
            key={s.id} 
            series={s} 
            onClick={() => onSeriesClick(s.id)} 
            hasDiamond={diamondSeries[s.id] || false}
            isCompleted={completedSeriesIds.includes(s.id)}
          />
        ))}
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { user, userData, getLastProgress, getDiamondSeries } = useAuth()
  const [continueEpisode, setContinueEpisode] = useState(null)
  const [diamondSeries, setDiamondSeries] = useState({})
  
  // Lista de IDs completados (com fallback para array vazio)
  const completedSeriesIds = userData?.completedSeriesIds || []

  // Carrega último progresso
  useEffect(() => {
    async function loadContinue() {
      if (!user) return
      
      // Proteção contra função não carregada
      if (!getLastProgress) return

      try {
        const lastProgress = await getLastProgress()
        
        // Só mostra se não estiver completo
        if (lastProgress && !lastProgress.completed) {
          const series = seriesData[lastProgress.seriesId]
          // Proteção contra crash se a série não for encontrada
          if (!series) return 

          const episode = series.episodes.find(ep => ep.id === parseInt(lastProgress.episodeId))
          const totalQuestions = episode?.questions.length || 3
          
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
      } catch (error) {
        console.error("Erro ao carregar progresso:", error)
      }
    }
    
    loadContinue()
  }, [user, getLastProgress])

  // Carrega diamantes (COM CORREÇÃO DE ERRO)
  useEffect(() => {
    async function loadDiamonds() {
      // Se não tiver user, OU se getDiamondSeries não for uma função válida, para aqui.
      // Isso evita o erro "intermediate value is undefined"
      if (!user || typeof getDiamondSeries !== 'function') return
      
      try {
        const diamonds = await getDiamondSeries(seriesData)
        if (diamonds) {
          setDiamondSeries(diamonds)
        }
      } catch (err) {
        console.error('Erro ao carregar diamantes:', err)
      }
    }
    
    loadDiamonds()
  }, [user, getDiamondSeries])

  const handleSeriesClick = (id) => navigate(`/series/${id}`)

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Se estiver logado, mostra stats + continue ouvindo */}
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

        {/* PILLARS */}
        <SeriesRow 
          title="The Pillars — A Base Sólida" 
          series={seriesByLevel.pillars || []} 
          onSeriesClick={handleSeriesClick} 
          diamondSeries={diamondSeries}
          completedSeriesIds={completedSeriesIds}
        />

        {/* STARTER */}
        <SeriesRow 
          title="Starter — Pré-A1" 
          series={seriesByLevel.starter} 
          onSeriesClick={handleSeriesClick} 
          diamondSeries={diamondSeries}
          completedSeriesIds={completedSeriesIds}
        />
        
        {/* A1 */}
        <SeriesRow 
          title="Nível A1 — Iniciante" 
          series={seriesByLevel.a1} 
          onSeriesClick={handleSeriesClick}
          diamondSeries={diamondSeries}
          completedSeriesIds={completedSeriesIds}
        />
        
        {/* A2 */}
        <SeriesRow 
          title="Nível A2 — Básico" 
          series={seriesByLevel.a2} 
          onSeriesClick={handleSeriesClick}
          diamondSeries={diamondSeries}
          completedSeriesIds={completedSeriesIds}
        />
      </main>
    </div>
  )
}

export default Home