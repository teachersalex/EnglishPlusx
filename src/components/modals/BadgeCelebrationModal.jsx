import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BADGE_DEFINITIONS } from '../../contexts/AuthContext'

/**
 * Modal de celebração de badges
 * Mostra um badge por vez com animação satisfatória
 * Se ganhou múltiplos, faz fila (um fecha, outro abre)
 */
export default function BadgeCelebrationModal({ badges = [], onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  
  // Abre o modal quando recebe badges
  useEffect(() => {
    if (badges.length > 0) {
      setCurrentIndex(0)
      setIsVisible(true)
    }
  }, [badges])
  
  const currentBadgeId = badges[currentIndex]
  const currentBadge = currentBadgeId ? BADGE_DEFINITIONS[currentBadgeId] : null
  const hasMore = currentIndex < badges.length - 1
  
  const handleNext = () => {
    if (hasMore) {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsVisible(true)
      }, 300)
    } else {
      setIsVisible(false)
      setTimeout(() => {
        onComplete?.()
      }, 300)
    }
  }
  
  if (!currentBadge) return null
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleNext}
        >
          {/* Backdrop escuro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          
          {/* Card do badge */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 300,
              delay: 0.1
            }}
            className="relative bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A] rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Confetti/Glow effect */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-500/20 blur-3xl" />
            </div>
            
            {/* Badge icon com animação */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                damping: 10, 
                stiffness: 200,
                delay: 0.3
              }}
              className="relative mx-auto w-28 h-28 mb-6"
            >
              {/* Círculo de fundo com glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-full border-2 border-yellow-500/50 flex items-center justify-center">
                <span className="text-5xl">{currentBadge.icon}</span>
              </div>
              
              {/* Shine effect */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 100, opacity: [0, 1, 0] }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
            </motion.div>
            
            {/* Título "Nova Conquista" */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-yellow-500 text-xs font-bold uppercase tracking-widest text-center mb-2"
            >
              Nova Conquista!
            </motion.p>
            
            {/* Nome do badge */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white text-2xl font-bold text-center mb-2"
            >
              {currentBadge.name}
            </motion.h2>
            
            {/* Descrição */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/60 text-center text-sm mb-8"
            >
              {currentBadge.description}
            </motion.p>
            
            {/* Botão */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              {hasMore ? 'Próxima →' : 'Incrível!'}
            </motion.button>
            
            {/* Indicador de quantidade */}
            {badges.length > 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/40 text-xs text-center mt-4"
              >
                {currentIndex + 1} de {badges.length}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}