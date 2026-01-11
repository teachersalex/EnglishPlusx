// src/components/audio/ProgressStepper.jsx
// Stepper visual de progresso do episódio
// ============================================

import { motion } from 'framer-motion'

const STEPS = [
  { id: 'listen', label: 'Ouvir' },
  { id: 'dictation', label: 'Ditado' },
  { id: 'quiz', label: 'Quiz' }
]

export default function ProgressStepper({ 
  audioCompleted, 
  dictationDone, 
  quizDone, 
  allUnlocked = false 
}) {
  const stepStatus = {
    listen: allUnlocked || audioCompleted,
    dictation: allUnlocked || dictationDone,
    quiz: allUnlocked || quizDone
  }

  return (
    <div className="flex items-center justify-center gap-1 mb-4">
      {STEPS.map((step, index) => {
        const isCompleted = stepStatus[step.id]
        
        return (
          <div key={step.id} className="flex items-center">
            {/* Bolinha */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? '#22C55E' : '#3D3529',
                  scale: isCompleted ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`w-3 h-3 rounded-full border-2 ${
                  isCompleted 
                    ? 'border-[#22C55E] bg-[#22C55E]' 
                    : 'border-[#6B7280] bg-transparent'
                }`}
              />
              <span className={`text-xs mt-1 font-medium ${
                isCompleted ? 'text-[#22C55E]' : 'text-[#6B7280]'
              }`}>
                {step.label}
              </span>
            </div>
            
            {/* Linha conectora (exceto após último) */}
            {index < STEPS.length - 1 && (
              <div className="w-12 sm:w-16 h-0.5 mx-1 mb-5 relative overflow-hidden bg-[#3D3529] rounded-full">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-[#22C55E] rounded-full"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
