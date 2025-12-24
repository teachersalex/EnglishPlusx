import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Odômetro de Streak
 * - Sempre anima no load
 * - Números rolam e param no valor real
 */
export default function StreakOdometer({ value, isAnimating, onAnimationComplete }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isRolling, setIsRolling] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const hasStarted = useRef(false)
  
  useEffect(() => {
    // Se não está animando, mostra valor final direto
    if (!isAnimating) {
      setDisplayValue(value)
      setIsRolling(false)
      hasStarted.current = false
      return
    }
    
    // Evita rodar duas vezes
    if (hasStarted.current) return
    hasStarted.current = true
    
    // Inicia animação
    setIsRolling(true)
    setShowParticles(false)
    
    // Sequência de números (12 aleatórios + valor final)
    const sequence = []
    for (let i = 0; i < 12; i++) {
      sequence.push(Math.floor(Math.random() * 10))
    }
    sequence.push(value) // ÚLTIMO É SEMPRE O VALOR REAL
    
    let index = 0
    
    const showNext = () => {
      setDisplayValue(sequence[index])
      
      if (index < sequence.length - 1) {
        index++
        const delay = 100 + (index * 30) // Vai ficando mais lento
        setTimeout(showNext, delay)
      } else {
        // Chegou no final - VALOR REAL
        setIsRolling(false)
        
        if (value > 0) {
          setShowParticles(true)
          setTimeout(() => setShowParticles(false), 800)
        }
        
        setTimeout(() => onAnimationComplete?.(), 300)
      }
    }
    
    // Começa
    setTimeout(showNext, 200)
    
  }, [isAnimating, value, onAnimationComplete])
  
  // Cores
  const getColor = () => {
    if (isRolling) return 'text-orange-400'
    if (value >= 7) return 'text-yellow-400'
    if (value >= 3) return 'text-orange-500'
    return 'text-[#E50914]'
  }
  
  // Glow
  const getGlow = () => {
    if (isRolling) return { textShadow: '0 0 20px rgba(251, 146, 60, 0.8)' }
    if (value >= 7) return { textShadow: '0 0 20px rgba(250, 204, 21, 0.8)' }
    if (value >= 3) return { textShadow: '0 0 15px rgba(249, 115, 22, 0.6)' }
    return {}
  }
  
  // Partículas
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i * 45) * (Math.PI / 180),
  }))
  
  return (
    <div className="flex items-baseline gap-1 justify-end relative">
      {/* Fogo - aparece enquanto anima */}
      <AnimatePresence>
        {isRolling && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [1, 1.2, 1] }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 0.2,
              scale: { repeat: Infinity, duration: 0.3 }
            }}
            className="text-sm self-center"
          >
            🔥
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Número */}
      <span 
        className={`font-bold text-lg tabular-nums leading-none ${getColor()}`}
        style={getGlow()}
      >
        {displayValue}
      </span>
      
      {/* "dias" / "dia" */}
      <span className={`font-bold text-lg leading-none ${getColor()}`}>
        {value === 1 ? 'dia' : 'dias'}
      </span>
      
      {/* Partículas */}
      <AnimatePresence>
        {showParticles && (
          <>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                animate={{ 
                  opacity: 0,
                  scale: 0,
                  x: Math.cos(p.angle) * 25,
                  y: Math.sin(p.angle) * 25
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-orange-400 pointer-events-none"
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}