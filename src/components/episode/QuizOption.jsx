// src/components/episode/QuizOption.jsx
// Uma opção de resposta do quiz
// ============================================

import { motion } from 'framer-motion'

export default function QuizOption({
  option,
  index,
  isSelected,
  isCorrectAnswer,
  showResult,
  wasCorrect,
  onClick,
  disabled
}) {
  // Determina estilos baseado no estado
  let styles = "bg-[#F5F5F5] text-[#1A1A1A] border-2 border-transparent"
  let icon = null

  if (showResult) {
    if (isSelected) {
      if (wasCorrect) {
        styles = "bg-[#22C55E]/10 border-[#22C55E] text-[#15803d]"
        icon = <CheckIcon />
      } else {
        styles = "bg-[#EF4444]/10 border-[#EF4444] text-[#B91C1C]"
        icon = <XIcon />
      }
    } else if (isCorrectAnswer && !wasCorrect) {
      styles = "bg-white border-[#22C55E]/30 opacity-60"
    } else {
      styles = "bg-[#F5F5F5] opacity-50"
    }
  } else {
    styles = "bg-[#F5F5F5] hover:bg-[#EAEAEA] hover:border-[#D4D4D4] cursor-pointer"
  }

  return (
    <motion.button
      whileHover={!showResult ? { scale: 1.01, y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" } : {}}
      whileTap={!showResult ? { scale: 0.98 } : {}}
      onClick={() => onClick(index)}
      disabled={disabled}
      className={`w-full p-4 rounded-xl text-left font-medium transition-all flex justify-between items-center ${styles}`}
    >
      <span>{option}</span>
      {icon}
    </motion.button>
  )
}

// ========== ICONS ==========

function CheckIcon() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
      <svg className="w-6 h-6 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </motion.div>
  )
}

function XIcon() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
      <svg className="w-6 h-6 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </motion.div>
  )
}
