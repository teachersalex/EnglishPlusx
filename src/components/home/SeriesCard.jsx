// src/components/home/SeriesCard.jsx
// Card visual de uma série
// ============================================

import { motion } from 'framer-motion'

export default function SeriesCard({ series, onClick, hasDiamond, isCompleted, isTutorial }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      data-tour={isTutorial ? "tutorial-series" : undefined}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer w-[160px] flex-shrink-0 relative group"
    >
      {/* Badge de Status */}
      <StatusBadge hasDiamond={hasDiamond} isCompleted={isCompleted} />
      
      {/* Capa */}
      <div className="aspect-[2/3] overflow-hidden relative">
        <img 
          src={series.coverImage} 
          alt={series.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay de brilho */}
        {hasDiamond && (
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/40 via-blue-400/10 to-transparent mix-blend-overlay" />
        )}
        {!hasDiamond && isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 via-yellow-300/10 to-transparent mix-blend-overlay" />
        )}
      </div>
      
      {/* Info */}
      <div className="p-3 bg-white relative">
        {/* Barra colorida no topo */}
        {hasDiamond && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500" />
        )}
        {!hasDiamond && isCompleted && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400" />
        )}

        <h3 className={`font-bold text-sm truncate ${
          hasDiamond ? 'text-blue-600' : isCompleted ? 'text-yellow-700' : 'text-[#1A1A1A]'
        }`}>
          {series.title}
        </h3>
        
        <p className="text-[#6B7280] text-xs mt-1 flex items-center gap-1">
          {series.episodes.length} {series.episodes.length === 1 ? 'episódio' : 'episódios'}
          {hasDiamond && <span className="text-blue-400 font-bold">• Platina</span>}
          {!hasDiamond && isCompleted && <span className="text-yellow-500 font-bold">• Completo</span>}
        </p>
      </div>
    </motion.div>
  )
}

// ========== SUB-COMPONENTES ==========

function StatusBadge({ hasDiamond, isCompleted }) {
  if (hasDiamond) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        className="absolute top-2 right-2 z-10"
      >
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
            <span className="text-white text-sm filter drop-shadow-md">💎</span>
          </div>
          {/* Sparkle animado */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.5],
              rotate: [0, 180, 360, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1 + Math.random() * 2,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
            className="absolute -top-1 -right-1 text-white text-xs pointer-events-none"
            style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9))' }}
          >
            ✦
          </motion.div>
        </div>
      </motion.div>
    )
  }
  
  if (isCompleted) {
    return (
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
    )
  }
  
  return null
}