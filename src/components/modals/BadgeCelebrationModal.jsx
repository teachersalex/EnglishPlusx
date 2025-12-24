import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BADGE_DEFINITIONS } from '../../utils/badgeSystem'

/**
 * Modal de Celebração de Badge - ÉPICO
 * 
 * Efeito "cravejada no metal":
 * 1. Tela escurece
 * 2. Badge aparece pequeno e distante
 * 3. Zoom dramático com motion blur
 * 4. IMPACTO - shake + sparks
 * 5. Brilho se espalha
 * 6. Texto aparece
 */
export default function BadgeCelebrationModal({ badge, onComplete }) {
  const [phase, setPhase] = useState(0)
  // 0 = entrada, 1 = zoom, 2 = impacto, 3 = brilho, 4 = texto
  
  const badgeData = badge ? BADGE_DEFINITIONS[badge] : null
  
  useEffect(() => {
    if (!badge) return
    
    // Timeline da animação
    setPhase(0)
    
    const timers = [
      setTimeout(() => setPhase(1), 100),   // Zoom
      setTimeout(() => setPhase(2), 600),   // Impacto
      setTimeout(() => setPhase(3), 800),   // Brilho
      setTimeout(() => setPhase(4), 1200),  // Texto
    ]
    
    return () => timers.forEach(clearTimeout)
  }, [badge])
  
  if (!badgeData) return null
  
  // Sparks para o impacto
  const sparks = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) * (Math.PI / 180),
    distance: 60 + Math.random() * 40,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 0.1
  }))
  
  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={phase >= 4 ? onComplete : undefined}
        >
          {/* Backdrop - mais escuro e dramático */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90"
          />
          
          {/* Textura metálica de fundo */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 50%, #333 0%, #111 100%),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.03) 2px,
                  rgba(255,255,255,0.03) 4px
                )
              `
            }}
          />
          
          {/* Container central com shake no impacto */}
          <motion.div
            animate={phase === 2 ? {
              x: [0, -8, 8, -4, 4, 0],
              y: [0, 4, -4, 2, -2, 0],
            } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative flex flex-col items-center"
          >
            {/* Badge container */}
            <div className="relative">
              {/* Glow de fundo (aparece na fase 3) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={phase >= 3 ? { 
                  opacity: [0, 0.8, 0.4],
                  scale: [0.5, 1.5, 1.2]
                } : {}}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 -m-16"
                style={{
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
                  filter: 'blur(20px)'
                }}
              />
              
              {/* Círculo metálico */}
              <motion.div
                initial={{ scale: 0.1, opacity: 0, rotateY: 180 }}
                animate={
                  phase >= 2 
                    ? { scale: 1, opacity: 1, rotateY: 0 }
                    : phase >= 1 
                      ? { scale: 0.8, opacity: 0.8, rotateY: 90 }
                      : { scale: 0.1, opacity: 0, rotateY: 180 }
                }
                transition={{ 
                  type: "spring",
                  damping: phase >= 2 ? 8 : 20,
                  stiffness: phase >= 2 ? 200 : 100,
                  duration: 0.5
                }}
                className="relative w-32 h-32"
              >
                {/* Borda metálica externa */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(145deg, #4a4a4a 0%, #1a1a1a 50%, #333 100%)',
                    boxShadow: phase >= 2 
                      ? '0 0 40px rgba(251, 191, 36, 0.5), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.5)'
                      : 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.5)'
                  }}
                />
                
                {/* Anel interno */}
                <div 
                  className="absolute inset-2 rounded-full"
                  style={{
                    background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
                    boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.5)'
                  }}
                />
                
                {/* Centro com ícone */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#1f1f1f] to-[#0a0a0a] flex items-center justify-center">
                  <motion.span 
                    className="text-5xl"
                    animate={phase >= 3 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {badgeData.icon}
                  </motion.span>
                </div>
                
                {/* Brilho metálico */}
                <motion.div
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={phase >= 3 ? { 
                    opacity: [0, 1, 0],
                    rotate: 180
                  } : {}}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 rounded-full overflow-hidden"
                >
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)'
                    }}
                  />
                </motion.div>
              </motion.div>
              
              {/* Sparks no impacto */}
              <AnimatePresence>
                {phase === 2 && sparks.map((spark) => (
                  <motion.div
                    key={spark.id}
                    initial={{ 
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      y: 0
                    }}
                    animate={{ 
                      opacity: 0,
                      scale: 0,
                      x: Math.cos(spark.angle) * spark.distance,
                      y: Math.sin(spark.angle) * spark.distance
                    }}
                    transition={{ 
                      duration: 0.5,
                      delay: spark.delay,
                      ease: "easeOut"
                    }}
                    className="absolute left-1/2 top-1/2 rounded-full bg-yellow-400"
                    style={{
                      width: spark.size,
                      height: spark.size,
                      boxShadow: '0 0 6px rgba(251, 191, 36, 0.8)'
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
            
            {/* Texto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="mt-8 text-center"
            >
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.5em' }}
                animate={phase >= 4 ? { opacity: 1, letterSpacing: '0.3em' } : {}}
                transition={{ duration: 0.5 }}
                className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2"
              >
                Conquista Desbloqueada
              </motion.p>
              
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                animate={phase >= 4 ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-white text-2xl font-bold mb-2"
              >
                {badgeData.name}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={phase >= 4 ? { opacity: 0.6 } : {}}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-white text-sm max-w-xs"
              >
                {badgeData.description}
              </motion.p>
            </motion.div>
            
            {/* Botão */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileTap={{ scale: 0.98 }}
              onClick={onComplete}
              className="mt-8 px-12 py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold text-lg shadow-lg shadow-yellow-500/20"
            >
              Continuar
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}