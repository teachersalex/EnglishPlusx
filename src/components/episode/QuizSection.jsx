// src/components/episode/QuizSection.jsx
// Container do quiz com barra de progresso
// ============================================

import { motion } from 'framer-motion'
import QuizOption from './QuizOption'

export default function QuizSection({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  selectedAnswer,
  lastAnswerCorrect,
  onAnswer,
  disabled
}) {
  if (!currentQuestion) return null

  const showResult = selectedAnswer !== null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
      data-tour="quiz-area"
    >
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="text-[#6B7280] text-sm">
          Pergunta {currentQuestionIndex + 1} de {totalQuestions}
        </span>
        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-sm">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <motion.div
              key={idx}
              className={`inline-block h-full ${
                idx <= currentQuestionIndex ? 'bg-[#E50914]' : 'bg-[#E5E5E5]'
              }`}
              style={{ width: `${100 / totalQuestions}%` }}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-[#000000]/5 mb-8">
        <h2 className="text-[#E50914] text-sm font-bold mb-2">QUIZ</h2>
        <h3 className="text-[#1A1A1A] text-xl font-bold mb-6">
          {currentQuestion.question}
        </h3>
        
        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <QuizOption
              key={index}
              option={option}
              index={index}
              isSelected={selectedAnswer === index}
              isCorrectAnswer={index === currentQuestion.correctAnswer}
              showResult={showResult}
              wasCorrect={lastAnswerCorrect}
              onClick={onAnswer}
              disabled={disabled || showResult}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
