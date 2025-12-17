import { motion } from 'framer-motion'

export default function FinalModal({ score, total, xp, onNext, onRestart, isLastEpisode }) {
  const percentage = Math.round((score / total) * 100)
  
  let emoji = '🎉'
  let message = 'PERFEITO!'
  let color = 'text-[#22C55E]'
  
  if (percentage < 100 && percentage >= 66) {
    emoji = '👏'
    message = 'MUITO BOM!'
    color = 'text-[#22C55E]'
  } else if (percentage < 66 && percentage >= 33) {
    emoji = '💪'
    message = 'BOM TRABALHO!'
    color = 'text-[#F59E0B]'
  } else if (percentage < 33) {
    emoji = '📚'
    message = 'CONTINUE PRATICANDO!'
    color = 'text-[#EF4444]'
  }

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
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-2xl p-8 text-center max-w-sm w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-6xl mb-4"
        >
          {emoji}
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-3xl font-black mb-2 ${color}`}
        >
          {message}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#6B7280] mb-4"
        >
          Você acertou {score} de {total}
        </motion.p>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="bg-[#F59E0B]/20 rounded-xl p-4 mb-6"
        >
          <p className="text-[#F59E0B] text-2xl font-black">+{xp} XP</p>
        </motion.div>

        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white ${
              isLastEpisode ? 'bg-[#22C55E]' : 'bg-[#E50914]'
            }`}
          >
            {isLastEpisode ? '🏆 Finalizar Série!' : 'Próximo Episódio →'}
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="w-full py-3 rounded-xl font-bold text-[#6B7280] hover:bg-[#F0F0F0] transition-colors"
          >
            🔄 Tentar Novamente
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}