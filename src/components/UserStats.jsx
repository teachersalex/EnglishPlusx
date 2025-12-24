import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth, BADGE_DEFINITIONS } from '../contexts/AuthContext'
import StreakOdometer from './StreakOdometer'

export default function UserStats({ user, continueEpisode }) {
  const navigate = useNavigate()
  const { getUserBadges } = useAuth()
  const [badges, setBadges] = useState([])
  const [showAllBadges, setShowAllBadges] = useState(false)
  const [seenBadges, setSeenBadges] = useState([])
  const [isAnimatingStreak, setIsAnimatingStreak] = useState(true) // Começa true!
  
  // Carrega badges vistos do localStorage
  useEffect(() => {
    if (!user?.uid) return
    const storageKey = `seenBadges_${user.uid}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setSeenBadges(JSON.parse(stored))
    }
  }, [user?.uid])

  // Carrega badges do usuário
  useEffect(() => {
    async function loadBadges() {
      if (getUserBadges) {
        const userBadges = await getUserBadges()
        setBadges(userBadges)
      } else if (user?.badges) {
        setBadges(user.badges)
      }
    }
    if (user) loadBadges()
  }, [user, getUserBadges])

  // Marca badges como vistos após 3 segundos
  useEffect(() => {
    if (!user?.uid || badges.length === 0) return
    
    const newBadges = badges.filter(b => !seenBadges.includes(b))
    if (newBadges.length === 0) return
    
    const timer = setTimeout(() => {
      const storageKey = `seenBadges_${user.uid}`
      const allSeen = [...new Set([...seenBadges, ...badges])]
      localStorage.setItem(storageKey, JSON.stringify(allSeen))
      setSeenBadges(allSeen)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [badges, seenBadges, user?.uid])

  // Early return após todos os hooks
  if (!user) return null
  
  // Calcula nível
  const level = Math.floor(user.xp / 100) + 1
  const xpInLevel = user.xp % 100
  const xpProgress = (xpInLevel / 100) * 100

  // Verifica se badge é novo
  const isNewBadge = (badgeId) => !seenBadges.includes(badgeId)

  // Badges para exibir
  const displayBadges = badges.slice(0, 4)
  const hasMoreBadges = badges.length > 4

  // Callback quando streak termina de animar
  const handleStreakAnimationComplete = () => {
    console.log('✅ Animação do streak completa')
    setIsAnimatingStreak(false)
  }

  return (
    <div className="mb-8">
      {/* Saudação + Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg mb-4"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Olá, {user.name}!</h1>
            <p className="text-[#6B7280] text-sm">Continue sua jornada</p>
          </div>
          
          {/* Streak com odômetro */}
          <div className="text-right">
            <StreakOdometer 
              value={user.streak || 0}
              isAnimating={isAnimatingStreak}
              onAnimationComplete={handleStreakAnimationComplete}
            />
            <p className="text-[#6B7280] text-xs">seguidos</p>
          </div>
        </div>

        {/* Barra de XP com Glow */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-bold text-[#1A1A1A]">Nível {level}</span>
            <span className="text-[#6B7280]">{user.xp || 0} XP</span>
          </div>
          <div className="h-3 bg-[#F0F0F0] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full sexy-progress-bar"
              style={{
                background: 'linear-gradient(90deg, #E50914 0%, #ff6b6b 50%, #E50914 100%)',
                backgroundSize: '200% 100%',
                animation: 'flow-shine 3s linear infinite',
                boxShadow: '0 0 10px rgba(229, 9, 20, 0.5)'
              }}
            />
          </div>
          <p className="text-[#6B7280] text-xs mt-1 text-right">
            {100 - xpInLevel} XP para o próximo nível
          </p>
        </div>

        {/* Badges Section */}
        {badges.length > 0 && (
          <div className="pt-4 border-t border-[#F0F0F0]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">
                Conquistas
              </p>
              {hasMoreBadges && (
                <button 
                  onClick={() => setShowAllBadges(!showAllBadges)}
                  className="text-[#E50914] text-xs font-medium hover:underline"
                >
                  {showAllBadges ? 'Ver menos' : `Ver todas (${badges.length})`}
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {(showAllBadges ? badges : displayBadges).map((badgeId, index) => {
                  const badge = BADGE_DEFINITIONS[badgeId]
                  if (!badge) return null
                  
                  const isNew = isNewBadge(badgeId)
                  
                  return (
                    <motion.div
                      key={badgeId}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative"
                    >
                      {/* Glow para badges novos */}
                      {isNew && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-50 animate-pulse" />
                      )}
                      
                      <div className={`relative w-10 h-10 bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow cursor-pointer ${isNew ? 'ring-2 ring-yellow-400' : ''}`}>
                        <span className="text-lg">{badge.icon}</span>
                      </div>
                      
                      {/* NEW indicator */}
                      {isNew && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-bold text-black">✦</span>
                        </span>
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1A1A1A] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <p className="font-bold">{badge.name}</p>
                        <p className="text-white/70">{badge.description}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A1A]" />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              
              {/* Placeholder para badges não conquistados */}
              {badges.length < 3 && (
                <div className="w-10 h-10 bg-[#F0F0F0] rounded-xl flex items-center justify-center border-2 border-dashed border-[#D1D5DB]">
                  <span className="text-[#D1D5DB] text-lg">?</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mostra hint se não tem badges */}
        {badges.length === 0 && (
          <div className="pt-4 border-t border-[#F0F0F0]">
            <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl">
              <div className="w-10 h-10 bg-[#F0F0F0] rounded-xl flex items-center justify-center">
                <span className="text-lg">🏆</span>
              </div>
              <div>
                <p className="text-[#1A1A1A] text-sm font-medium">Conquistas</p>
                <p className="text-[#6B7280] text-xs">Complete episódios para ganhar badges!</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Continue ouvindo */}
      {continueEpisode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate(continueEpisode.url)}
          className="bg-[#1A1A1A] rounded-2xl p-4 shadow-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors"
        >
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-3">Continue ouvindo</p>
          <div className="flex gap-4">
            <img 
              src={continueEpisode.coverImage}
              alt={continueEpisode.seriesTitle}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-white font-bold">{continueEpisode.seriesTitle}</h3>
              <p className="text-[#6B7280] text-sm">{continueEpisode.episodeTitle}</p>
              <div className="mt-2">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#E50914] rounded-full"
                    style={{ width: `${continueEpisode.progress}%` }}
                  />
                </div>
                <p className="text-[#6B7280] text-xs mt-1">
                  {continueEpisode.questionsAnswered}/{continueEpisode.totalQuestions} perguntas
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}