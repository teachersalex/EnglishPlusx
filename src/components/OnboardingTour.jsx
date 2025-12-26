// src/components/OnboardingTour.jsx

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Utilitário para gerenciar estado do onboarding via localStorage
 */
export const OnboardingStorage = {
  getStep: function() {
    return localStorage.getItem('onboardingStep') || null
  },
  setStep: function(step) {
    localStorage.setItem('onboardingStep', step)
  },
  isComplete: function() {
    return localStorage.getItem('onboardingStep') === 'done'
  },
  complete: function() {
    localStorage.setItem('onboardingStep', 'done')
  },
  reset: function() {
    localStorage.removeItem('onboardingStep')
  }
}

// Expõe função de reset no window para facilitar testes
if (typeof window !== 'undefined') {
  window.resetTutorial = () => {
    localStorage.removeItem('onboardingStep')
    location.reload()
  }
}

/**
 * Seta animada apontando para o elemento
 */
function AnimatedArrow({ direction = 'up' }) {
  const rotations = {
    up: 0,
    down: 180,
    left: -90,
    right: 90,
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center"
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
    >
      <motion.svg
        width="40"
        height="50"
        viewBox="0 0 40 50"
        fill="none"
        animate={{ y: [0, -10, 0] }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          ease: "easeInOut"
        }}
      >
        {/* Seta principal */}
        <path
          d="M20 0 L35 20 L25 20 L25 50 L15 50 L15 20 L5 20 Z"
          fill="white"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
        />
        {/* Brilho interno */}
        <path
          d="M20 4 L31 19 L25 19 L25 46 L19 46 L19 19 L9 19 Z"
          fill="url(#arrowGradient)"
        />
        <defs>
          <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0e0e0" />
          </linearGradient>
        </defs>
      </motion.svg>
    </motion.div>
  )
}

/**
 * Tour guiado com spotlight
 */
function OnboardingTour({ steps, onComplete, onStepChange, isActive, currentStep = 0 }) {
  const [spotlightStyle, setSpotlightStyle] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 })
  const [arrowDirection, setArrowDirection] = useState('up')

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  useEffect(() => {
    if (!isActive || !step?.target) return

    const updatePosition = () => {
      const element = document.querySelector(step.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        const padding = 8
        
        setSpotlightStyle({
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          clientTop: rect.top - padding,
        })

        const tooltipWidth = 300
        const tooltipHeight = 160
        const margin = 16
        const arrowSize = 50
        
        let top, left, aTop, aLeft, aDir
        
        switch (step.position) {
          case 'top':
            top = rect.top - tooltipHeight - margin - arrowSize
            left = rect.left + rect.width / 2 - tooltipWidth / 2
            aTop = rect.top - arrowSize - margin / 2
            aLeft = rect.left + rect.width / 2 - 20
            aDir = 'down'
            break
          case 'bottom':
          default:
            top = rect.bottom + margin + arrowSize
            left = rect.left + rect.width / 2 - tooltipWidth / 2
            aTop = rect.bottom + margin / 2
            aLeft = rect.left + rect.width / 2 - 20
            aDir = 'up'
            break
          case 'left':
            top = rect.top + rect.height / 2 - tooltipHeight / 2
            left = rect.left - tooltipWidth - margin - arrowSize
            aTop = rect.top + rect.height / 2 - 25
            aLeft = rect.left - arrowSize - margin / 2
            aDir = 'right'
            break
          case 'right':
            top = rect.top + rect.height / 2 - tooltipHeight / 2
            left = rect.right + margin + arrowSize
            aTop = rect.top + rect.height / 2 - 25
            aLeft = rect.right + margin / 2
            aDir = 'left'
            break
        }
        
        // Garante que tooltip não sai da tela
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin))
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin))
        
        setTooltipPosition({ top, left })
        setArrowPosition({ top: aTop, left: aLeft })
        setArrowDirection(aDir)

        // Scroll suave se necessário
        const elementTop = rect.top
        if (elementTop < 80 || elementTop > window.innerHeight - 250) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }

    const timer = setTimeout(updatePosition, 150)
    
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [currentStep, isActive, step?.target, step?.position])

  const handleSpotlightClick = () => {
    if (step?.allowClick) {
      const element = document.querySelector(step.target)
      if (element) {
        // Se tem próxima página, salva o step
        if (step.nextPage) {
          OnboardingStorage.setStep(step.nextPage)
        } 
        // Se NÃO tem próxima página e é último ou finishTour, completa
        else if (isLast || step.finishTour) {
          OnboardingStorage.complete()
        }
        
        // Fecha o modal
        onComplete()
        
        // Clica no elemento
        setTimeout(() => {
          element.click()
        }, 50)
      }
    }
  }

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else if (onStepChange) {
      onStepChange(currentStep + 1)
    }
  }

  const handleSkip = () => {
    OnboardingStorage.complete()
    onComplete()
  }

  if (!isActive || !step) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-50"
      >
        {/* Overlay escuro */}
        {spotlightStyle && (
          <>
            <div 
              className="fixed bg-black/80 left-0 right-0 top-0"
              style={{ height: spotlightStyle.clientTop }}
            />
            <div 
              className="fixed bg-black/80"
              style={{ 
                top: spotlightStyle.clientTop,
                left: 0,
                width: spotlightStyle.left,
                height: spotlightStyle.height
              }}
            />
            <div 
              className="fixed bg-black/80"
              style={{ 
                top: spotlightStyle.clientTop,
                left: spotlightStyle.left + spotlightStyle.width,
                right: 0,
                height: spotlightStyle.height
              }}
            />
            <div 
              className="fixed bg-black/80 left-0 right-0 bottom-0"
              style={{ top: spotlightStyle.clientTop + spotlightStyle.height }}
            />
          </>
        )}
        
        {/* Spotlight */}
        {spotlightStyle && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              top: spotlightStyle.clientTop,
              left: spotlightStyle.left,
              width: spotlightStyle.width,
              height: spotlightStyle.height,
            }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.46, 0.45, 0.94],
              layout: { duration: 0.4 }
            }}
            onClick={handleSpotlightClick}
            className={`fixed rounded-xl ring-4 ring-white/60 ${step.allowClick ? 'cursor-pointer' : ''}`}
            style={{
              pointerEvents: step.allowClick ? 'auto' : 'none',
            }}
          >
            {step.allowClick && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.02, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-xl ring-2 ring-white/50"
              />
            )}
          </motion.div>
        )}

        {/* Seta animada */}
        {spotlightStyle && step.allowClick && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              top: arrowPosition.top,
              left: arrowPosition.left,
            }}
            transition={{ 
              duration: 0.4, 
              delay: 0.25,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="fixed z-20 pointer-events-none"
          >
            <AnimatedArrow direction={arrowDirection} />
          </motion.div>
        )}

        {/* Tooltip */}
        {spotlightStyle && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ 
              duration: 0.4, 
              delay: 0.15,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="fixed z-10"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              width: 300,
            }}
          >
            <div className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100">
              {step.emoji && (
                <div className="text-3xl mb-2">{step.emoji}</div>
              )}
              
              <h3 className="text-[#1A1A1A] font-bold text-lg mb-2">
                {step.title}
              </h3>
              
              <p className="text-[#6B7280] text-sm mb-4 leading-relaxed">
                {step.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentStep 
                          ? 'bg-[#E50914]' 
                          : i < currentStep 
                            ? 'bg-[#E50914]/50' 
                            : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {currentStep === 0 && steps.length > 1 && (
                    <button
                      onClick={handleSkip}
                      className="text-[#6B7280] text-sm hover:text-[#1A1A1A] transition-colors px-3 py-2"
                    >
                      Pular
                    </button>
                  )}
                  
                  {!step.allowClick && (
                    <button
                      onClick={handleNext}
                      className="bg-[#E50914] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#B20710] transition-colors"
                    >
                      {isLast ? 'Entendi!' : 'Próximo'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default OnboardingTour