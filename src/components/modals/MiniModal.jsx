import { motion, AnimatePresence } from 'framer-motion'

export default function MiniModal({ isCorrect, onNext, onRetry }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1A1A1A] rounded-3xl p-6 text-center max-w-xs w-full border border-white/10 shadow-2xl overflow-hidden relative"
      >
        {/* Glow sutil */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 blur-[50px] opacity-20 pointer-events-none ${isCorrect ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />

        {/* Ícone */}
        <div className="flex justify-center mb-4 relative z-10">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
              isCorrect ? 'bg-[#22C55E]/10 border-[#22C55E] text-[#22C55E]' : 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
            }`}
          >
            {isCorrect ? (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </motion.div>
        </div>
        
        {/* Título */}
        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
          {isCorrect ? "That's right!" : 'Not quite...'}
        </h2>

        {/* XP Badge */}
        <div className="h-8 mb-6 flex justify-center items-center relative z-10">
          {isCorrect && (
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span className="text-[#F59E0B] text-xs font-bold">+10 XP</span>
            </div>
          )}
        </div>

        {/* Botão */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={isCorrect ? onNext : onRetry}
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg relative z-10 ${
            isCorrect 
              ? 'bg-[#1A1A1A] border border-white/20 hover:bg-white/10' 
              : 'bg-[#EF4444] hover:bg-[#dc2626] shadow-red-900/20'
          }`}
        >
          {isCorrect ? 'Continuar' : 'Tentar Novamente'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}