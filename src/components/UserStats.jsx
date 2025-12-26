import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BADGE_DEFINITIONS, BADGE_DISPLAY_ORDER, getBadgeProgress } from '../utils/badgeSystem'
import StreakOdometer from './StreakOdometer'

// ============================================
// MODAL DE BADGE (ao clicar)
// ============================================
function BadgeDetailModal({ badge, isUnlocked, userData, onClose }) {
  if (!badge) return null
  
  const badgeData = BADGE_DEFINITIONS[badge]
  if (!badgeData) return null
  
  const progress = !isUnlocked ? getBadgeProgress(badge, userData) : null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1A1A1A] rounded-2xl p-6 max-w-xs w-full border border-white/10 shadow-2xl"
      >
        {/* Ícone */}
        <div className="flex justify-center mb-4">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
            isUnlocked 
              ? 'bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border border-white/20' 
              : 'bg-[#2A2A2A] border-2 border-dashed border-white/10'
          }`}>
            <span className={`text-4xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>
              {badgeData.icon}
            </span>
          </div>
        </div>
        
        {/* Nome */}
        <h3 className={`text-center text-xl font-bold mb-2 ${
          isUnlocked ? 'text-white' : 'text-white/50'
        }`}>
          {badgeData.name}
        </h3>
        
        {/* Status */}
        <div className="flex justify-center mb-4">
          {isUnlocked ? (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
              ✓ CONQUISTADO
            </span>
          ) : (
            <span className="px-3 py-1 bg-white/5 text-white/40 text-xs font-bold rounded-full">
              🔒 BLOQUEADO
            </span>
          )}
        </div>
        
        {/* Descrição */}
        <p className="text-center text-white/70 text-sm mb-4 leading-relaxed">
          {badgeData.description}
        </p>
        
        {/* Barra de Progresso (só se bloqueado) */}
        {!isUnlocked && progress && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>Progresso</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </div>
            <p className="text-center text-white/40 text-xs mt-2">
              {progress.percentage === 0 
                ? 'Ainda não começou' 
                : `Falta${progress.total - progress.current === 1 ? '' : 'm'} ${progress.total - progress.current}!`
              }
            </p>
          </div>
        )}
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function UserStats({ user, continueEpisode }) {
  const navigate = useNavigate()
  const { getUserBadges, userData: authUserData } = useAuth()
  const [badges, setBadges] = useState([])
  const [isAnimatingStreak, setIsAnimatingStreak] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState(null)
  
  // Usa userData do prop ou do auth
  const currentUserData = user || authUserData

  // Carrega badges do usuário
  useEffect(() => {
    async function loadBadges() {
      if (getUserBadges) {
        const userBadges = await getUserBadges()
        setBadges(userBadges || [])
      } else if (user?.badges) {
        setBadges(user.badges)
      }
    }
    if (user) loadBadges()
  }, [user, getUserBadges])

  if (!user) return null
  
  // Calcula nível (cada 100 XP = 1 nível)
  const level = Math.floor((user.xp || 0) / 100) + 1
  const xpInLevel = (user.xp || 0) % 100
  const xpProgress = (xpInLevel / 100) * 100

  const hasBadge = (badgeId) => badges.includes(badgeId)
  const badgeCount = badges.length
  const totalBadges = BADGE_DISPLAY_ORDER.length

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
              className="h-full rounded-full"
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
              {badgeCount}/{totalBadges}
            </p>
          </div>
          
          <div className="grid grid-cols-6 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {BADGE_DISPLAY_ORDER.map((badgeId, index) => {
              const badge = BADGE_DEFINITIONS[badgeId]
              if (!badge) return null
              
              const unlocked = hasBadge(badgeId)
              const progress = !unlocked ? getBadgeProgress(badgeId, currentUserData) : null
              
              return (
                <motion.div
                  key={badgeId}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedBadge(badgeId)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all ${
                      unlocked
                        ? 'bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] shadow-lg border border-white/10 cursor-pointer'
                        : 'bg-[#F5F5F5] border-2 border-dashed border-[#E0E0E0] cursor-pointer hover:border-[#BDBDBD]'
                    }`}
                  >
                    {unlocked ? (
                      <span className="text-2xl sm:text-3xl filter drop-shadow-md">
                        {badge.icon}
                      </span>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span className="text-xl sm:text-2xl grayscale opacity-20">
                          {badge.icon}
                        </span>
                        {/* Mini barra de progresso */}
                        {progress && progress.percentage > 0 && (
                          <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Botão de Continuar */}
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

      {/* Modal de Detalhe do Badge */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            isUnlocked={hasBadge(selectedBadge)}
            userData={currentUserData}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}