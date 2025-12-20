import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

// Reutilizando o Backdrop leve
const Backdrop = ({ children }) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
)

export default function FinalModal({ score, total, xp, onNext, onRestart, isLastEpisode }) {
  const [displayScore, setDisplayScore] = useState(0)
  const [displayXP, setDisplayXP] = useState(0)

  // Configuração Visual
  const percentage = (score / total) * 100
  let variant = {
    title: 'PERFECT SCORE',
    color: 'text-[#F59E0B]',
    bgGlow: 'bg-[#F59E0B]/20',
    icon: (
      <svg className="w-20 h-20 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    )
  }

  if (percentage < 100 && percentage >= 70) {
    variant = {
      title: 'EXCELLENT',
      color: 'text-[#22C55E]',
      bgGlow: 'bg-[#22C55E]/20',
      icon: (
        <svg className="w-20 h-20 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
        </svg>
      )
    }
  } else if (percentage < 70) {
    variant = {
      title: 'GOOD PRACTICE',
      color: 'text-white',
      bgGlow: 'bg-white/10',
      icon: (
        <svg className="w-20 h-20 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  }

  useEffect(() => {
    // Confete otimizado (dispara menos partículas para não travar)
    if (percentage >= 70) {
      const end = Date.now() + 1500 // Menos tempo de confete
      const frame = () => {
        confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#E50914', '#ffffff', '#F59E0B'] })
        confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#E50914', '#ffffff', '#F59E0B'] })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }

    // Rolling Numbers Otimizado
    let startTimestamp = null
    const duration = 1500
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // Ease-out expo para ficar mais chique
      const easeOut = 1 - Math.pow(1 - progress, 3) 
      
      setDisplayScore(Math.floor(easeOut * score))
      setDisplayXP(Math.floor(easeOut * xp))
      
      if (progress < 1) window.requestAnimationFrame(step)
    }
    window.requestAnimationFrame(step)
    
  }, [score, xp, percentage])

  return (
    <Backdrop>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="bg-[#1A1A1A] w-full max-w-sm rounded-3xl p-8 text-center border border-white/10 shadow-2xl relative overflow-hidden"
      >
        {/* Glow de fundo estático (menos repaint) */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 ${variant.bgGlow} blur-[80px] pointer-events-none opacity-50`} />

        {/* Ícone Principal */}
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
          className="relative z-10 flex justify-center mb-6"
        >
          <div className="p-5 bg-white/5 rounded-full border border-white/10 shadow-lg backdrop-blur-sm">
            {variant.icon}
          </div>
        </motion.div>

        {/* Título */}
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-2xl font-black tracking-widest italic mb-8 ${variant.color}`}
        >
          {variant.title}
        </motion.h2>

        {/* Grid de Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Acertos</p>
            <p className="text-3xl font-bold text-white flex items-baseline justify-center gap-1">
              {displayScore}<span className="text-sm text-white/40 font-normal">/{total}</span>
            </p>
          </div>

          <div className="bg-[#E50914]/10 rounded-2xl p-4 border border-[#E50914]/20">
            <p className="text-[#E50914] text-[10px] font-bold uppercase tracking-wider mb-1">XP Ganho</p>
            <p className="text-3xl font-bold text-[#E50914]">+{displayXP}</p>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNext}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              isLastEpisode ? 'bg-[#22C55E] hover:bg-[#16a34a]' : 'bg-[#E50914] hover:bg-[#cc0812]'
            }`}
          >
            {isLastEpisode ? 'Concluir Série' : 'Próximo Episódio'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </motion.button>

          <button 
            onClick={onRestart}
            className="text-white/40 hover:text-white text-xs font-medium uppercase tracking-widest transition-colors py-2 flex items-center justify-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Jogar Novamente
          </button>
        </div>
      </motion.div>
    </Backdrop>
  )
}