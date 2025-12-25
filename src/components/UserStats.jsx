import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth, BADGE_DEFINITIONS } from '../contexts/AuthContext'
import StreakOdometer from './StreakOdometer'

// [v7] A LISTA DEFINITIVA (7 Badges Tangíveis)
// Ordem de exibição visual na tela
const BADGE_SLOTS = [
  'sharp_ear',        // 1. O Início (1º 100%)
  'on_fire',          // 2. O Hábito (3 dias)
  'diamond_hunter',   // 3. O Vício (1º Diamante)
  'rising_star',      // 4. Progresso (500 XP)
  'precision_master', // 5. Consistência (3 Diamantes)
  'scholar',          // 6. Volume (5 Séries)
  'collector'         // 7. A Elite (5 Diamantes)
]

export default function UserStats({ user, continueEpisode }) {
  const navigate = useNavigate()
  const { getUserBadges } = useAuth()
  const [badges, setBadges] = useState([])
  const [seenBadges, setSeenBadges] = useState([])
  const [isAnimatingStreak, setIsAnimatingStreak] = useState(true)
  
  // Carrega badges vistos do localStorage para controlar o efeito "NEW"
  useEffect(() => {
    if (!user?.uid) return
    const storageKey = `seenBadges_${user.uid}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setSeenBadges(JSON.parse(stored))
    }
  }, [user?.uid])

  // Carrega badges do usuário do Firestore
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

  // Marca badges como vistos após 3 segundos (para sumir o brilho "NEW")
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

  if (!user) return null
  
  // Calcula nível (cada 100 XP = 1 nível)
  const level = Math.floor(user.xp / 100) + 1
  const xpInLevel = user.xp % 100
  const xpProgress = (xpInLevel / 100) * 100

  // Helpers de verificação
  const isNewBadge = (badgeId) => !seenBadges.includes(badgeId)
  const hasBadge = (badgeId) => badges.includes(badgeId)

  return (
    <div className="mb-8">
      {/* Card Principal de Stats */}
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
          
          {/* Streak Odômetro */}
          <div className="text-right">
            <StreakOdometer 
              value={user.streak || 0}
              isAnimating={isAnimatingStreak}
              onAnimationComplete={() => setIsAnimatingStreak(false)}
            />
            <p className="text-[#6B7280] text-xs">seguidos</p>
          </div>
        </div>

        {/* Barra de XP */}
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
        </div>

        {/* Badges Grid (A Vitrine) */}
        <div className="pt-4 border-t border-[#F0F0F0]">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">
              Conquistas
            </p>
            <p className="text-[#9CA3AF] text-xs">
              {badges.length}/{BADGE_SLOTS.length}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {BADGE_SLOTS.map((badgeId, index) => {
              const badge = BADGE_DEFINITIONS[badgeId]
              if (!badge) return null
              
              const unlocked = hasBadge(badgeId)
              const isNew = unlocked && isNewBadge(badgeId)
              
              return (
                <motion.div
                  key={badgeId}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  {/* Glow pulsante se for novo */}
                  {isNew && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-50 animate-pulse" />
                  )}
                  
                  {unlocked ? (
                    // Badge Conquistado
                    <div className={`relative w-12 h-12 bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-xl flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all cursor-pointer ${isNew ? 'ring-2 ring-yellow-400' : ''}`}>
                      <span className="text-2xl filter drop-shadow-md">{badge.icon}</span>
                    </div>
                  ) : (
                    // Badge Bloqueado (Cadeado)
                    <div className="relative w-12 h-12 bg-[#F5F5F5] rounded-xl flex items-center justify-center border-2 border-dashed border-[#E0E0E0] opacity-60 hover:opacity-100 transition-opacity cursor-help">
                      <span className="text-[#BDBDBD] text-xs">🔒</span>
                    </div>
                  )}
                  
                  {/* Indicador de "NOVO" */}
                  {isNew && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white">
                      <span className="text-[8px] font-bold text-black">!</span>
                    </span>
                  )}
                  
                  {/* Tooltip (mostra dica se bloqueado, parabéns se desbloqueado) */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1A1A1A] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 min-w-[140px] text-center shadow-xl">
                    <p className="font-bold text-yellow-500 mb-0.5">{badge.name}</p>
                    <p className={unlocked ? "text-white/90" : "text-white/50 italic"}>
                      {unlocked ? "Conquistado!" : badge.description}
                    </p>
                    {/* Seta do tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A1A]" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Botão de Continuar (Sticky na mente do usuário) */}
      {continueEpisode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate(continueEpisode.url)}
          className="bg-[#1A1A1A] rounded-2xl p-4 shadow-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors group"
        >
          <div className="flex justify-between items-center mb-3">
            <p className="text-[#6B7280] text-xs uppercase tracking-wide">Continue ouvindo</p>
            <span className="text-white/40 text-xs group-hover:text-white transition-colors">▶</span>
          </div>
          
          <div className="flex gap-4">
            <img 
              src={continueEpisode.coverImage}
              alt={continueEpisode.seriesTitle}
              className="w-20 h-20 object-cover rounded-lg shadow-md"
            />
            <div className="flex-1">
              <h3 className="text-white font-bold">{continueEpisode.seriesTitle}</h3>
              <p className="text-[#6B7280] text-sm">{continueEpisode.episodeTitle}</p>
              
              <div className="mt-3">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#E50914] rounded-full relative"
                    style={{ width: `${continueEpisode.progress}%` }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}