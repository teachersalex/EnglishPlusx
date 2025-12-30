// src/components/DictationResult.jsx
// Tela de resultado do ditado com diff visual
// ============================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DictationResult({ 
  feedback, 
  xpEarned, 
  isNewRecord, 
  onReset 
}) {
  const [showCopyWarning, setShowCopyWarning] = useState(false)

  if (!feedback) return null

  // Bloqueia cópia e mostra feedback
  const handleCopyAttempt = (e) => {
    e.preventDefault()
    setShowCopyWarning(true)
    setTimeout(() => setShowCopyWarning(false), 2000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
    >
      {/* Header do resultado */}
      <div className={`p-5 ${
        feedback.score >= 90 
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
          : feedback.score >= 70 
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : 'bg-gradient-to-r from-slate-600 to-slate-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
              {feedback.score >= 90 ? 'Excelente!' : feedback.score >= 70 ? 'Bom trabalho!' : 'Continue praticando'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{feedback.score}%</span>
              <span className="text-white/60 text-sm">de acerto</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/90 text-2xl font-semibold">
              {feedback.correctCount}<span className="text-white/50 text-lg">/{feedback.total}</span>
            </div>
            <p className="text-white/60 text-xs">palavras certas</p>
          </div>
        </div>
        
        {/* Badges de XP + Recorde + Diamante */}
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-2">
          {/* XP Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
          >
            <span className="text-yellow-300 text-sm">⭐</span>
            <span className="text-white font-bold text-sm">+{xpEarned} XP</span>
          </motion.div>
          
          {/* Novo Recorde Badge */}
          {isNewRecord && (
            <motion.div
              initial={{ scale: 0, rotate: 10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="flex items-center gap-1.5 bg-yellow-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
            >
              <span className="text-sm">🏆</span>
              <span className="text-yellow-100 font-bold text-sm">Novo Recorde!</span>
            </motion.div>
          )}
          
          {/* Diamond Progress */}
          {feedback.score >= 95 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="flex items-center gap-1.5 bg-cyan-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
            >
              <span className="text-sm">💎</span>
              <span className="text-cyan-100 font-bold text-sm">Nível Diamante!</span>
            </motion.div>
          ) : feedback.score >= 80 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"
            >
              <span className="text-sm opacity-50">💎</span>
              <span className="text-white/70 text-xs">Faltam {95 - feedback.score}% para 💎</span>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Corpo do resultado */}
      <div className="bg-[#FAF8F5] p-5">
        <p className="text-[#8B7E6A] text-xs font-medium uppercase tracking-wider mb-3">
          Sua transcrição
        </p>
        
        {/* Área protegida contra cópia */}
        <div 
          className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E2D9] leading-relaxed text-lg select-none relative"
          onCopy={handleCopyAttempt}
          onCut={handleCopyAttempt}
          onContextMenu={handleCopyAttempt}
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          {/* Toast de aviso - Sem Cola */}
          <AnimatePresence>
            {showCopyWarning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#3D3529] text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2"
              >
                <span>✋</span>
                <span>Sem cola! Digite para aprender</span>
              </motion.div>
            )}
          </AnimatePresence>

          {feedback.diffResult.map((item, idx) => {
            if (item.type === 'title') {
              return <span key={idx} className="text-slate-300 text-sm mr-1">{item.word}</span>
            }
            
            if (item.type === 'correct') {
              return <span key={idx} className="text-[#3D3529]">{item.word} </span>
            }
            
            if (item.type === 'missing') {
              return (
                <span 
                  key={idx} 
                  className="inline-block bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mx-0.5 font-medium"
                  title="Faltou esta palavra"
                >
                  {item.word}
                </span>
              )
            }
            
            if (item.type === 'extra') {
              return (
                <span 
                  key={idx} 
                  className="text-slate-400 line-through decoration-slate-300 text-base mx-0.5"
                >
                  {item.word}
                </span>
              )
            }
            
            return (
              <span key={idx} className="inline-flex items-baseline mx-0.5">
                <span className="text-red-400 line-through decoration-red-300 text-base">{item.word}</span>
                <span className="text-emerald-600 font-medium ml-1">{item.expected}</span>
              </span>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#E8E2D9] justify-center">
          <span className="flex items-center gap-1.5 text-xs text-[#8B7E6A]">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></span>
            Faltou
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#8B7E6A]">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></span>
            Correção
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#8B7E6A]">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 relative">
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-full h-px bg-slate-400 rotate-[-10deg]"></span>
              </span>
            </span>
            Extra
          </span>
        </div>

        {/* Botão tentar novamente */}
        <motion.button 
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={onReset}
          className="w-full mt-5 py-4 rounded-xl bg-[#1A1A1A] text-white font-semibold hover:bg-[#2A2A2A] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Tentar Novamente
        </motion.button>
      </div>
    </motion.div>
  )
}