import { motion } from 'framer-motion'

export default function MiniModal({ isCorrect, onNext, onRetry }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1A1A1A] rounded-3xl p-6 text-center max-w-xs w-full border border-white/10 shadow-2xl"
      >
        {/* Ícone de Feedback */}
        <div className="flex justify-center mb-4">
          <motion.div
            initial={{ scale: 0, rotate: isCorrect ? 0 : -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
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
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          {isCorrect ? 'That\'s right!' : 'Not quite...'}
        </motion.h2>

        {/* XP Badge (Só se acertar) */}
        <div className="h-8 mb-6 flex justify-center items-center">
          {isCorrect && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1 rounded-full flex items-center gap-1"
            >
              <svg className="w-3 h-3 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span className="text-[#F59E0B] text-xs font-bold">+10 XP</span>
            </motion.div>
          )}
        </div>

        {/* Botão de Ação */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.96 }}
          onClick={isCorrect ? onNext : onRetry}
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${
            isCorrect 
              ? 'bg-[#1A1A1A] border border-white/20 hover:bg-white/10' 
              : 'bg-[#EF4444] hover:bg-[#dc2626] shadow-red-900/20'
          }`}
        >
          {isCorrect ? 'Continuar' : 'Tentar Novamente'}
        </motion.button>
      </motion.div>
    </div>
  )
}