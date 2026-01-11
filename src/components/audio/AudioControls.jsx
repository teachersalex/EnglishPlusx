// src/components/audio/AudioControls.jsx
// Controles de play, skip e velocidade
// ============================================

import { motion } from 'framer-motion'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]

export default function AudioControls({
  isPlaying,
  playbackRate,
  onTogglePlay,
  onSkip,
  onChangeSpeed
}) {
  return (
    <>
      {/* Botões principais */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {/* -5s */}
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => onSkip(-5)} 
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20 hover:scale-105 transition-all"
        >
          -5s
        </motion.button>
        
        {/* Play/Pause */}
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={onTogglePlay} 
          data-tour="play-button"
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-[0_0_20px_rgba(229,9,20,0.6)] hover:scale-105 transition-all z-10"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>
        
        {/* +5s */}
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => onSkip(5)} 
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20 hover:scale-105 transition-all"
        >
          +5s
        </motion.button>
      </div>

      {/* Velocidades */}
      <div 
        data-tour="speed-controls"
        className="flex items-center justify-center gap-2 mb-6"
      >
        {SPEEDS.map((speed) => (
          <motion.button
            key={speed}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChangeSpeed(speed)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
              playbackRate === speed 
                ? 'bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.4)]' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>
    </>
  )
}
