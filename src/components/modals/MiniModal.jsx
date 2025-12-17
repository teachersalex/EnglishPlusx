import { motion } from 'framer-motion'

export default function MiniModal({ isCorrect, onNext, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 text-center max-w-xs w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="text-5xl mb-3"
        >
          {isCorrect ? '✅' : '❌'}
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-2xl font-black mb-4 ${isCorrect ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
        >
          {isCorrect ? 'Isso aí!' : 'Ops!'}
        </motion.h2>

        {isCorrect && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="bg-[#F59E0B]/20 rounded-xl p-3 mb-4"
          >
            <p className="text-[#F59E0B] text-xl font-black">+10 XP</p>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isCorrect ? onNext : onRetry}
          className="w-full bg-[#E50914] text-white py-3 rounded-xl font-bold"
        >
          {isCorrect ? 'Próxima →' : 'Tentar Novamente'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}