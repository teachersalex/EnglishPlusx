import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function UserStats({ user, continueEpisode }) {
  const navigate = useNavigate()
  
  // CONFIGURAÇÃO DO EMAIL ADMIN
  const ADMIN_EMAIL = "alexmg@gmail.com"

  // Se não tiver dados ainda, não mostra nada
  if (!user) return null
  
  // Calcula nível baseado no XP (100 XP por nível)
  const level = Math.floor(user.xp / 100) + 1
  const xpInLevel = user.xp % 100
  const xpProgress = (xpInLevel / 100) * 100

  return (
    <div className="mb-8">
      {/* Saudação + Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg mb-4"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Olá, {user.name}!</h1>
            <p className="text-[#6B7280] text-sm">Continue sua jornada</p>
          </div>
          <div className="text-right">
            <p className="text-[#E50914] font-bold text-lg">{user.streak} dias</p>
            <p className="text-[#6B7280] text-xs">seguidos</p>
          </div>
        </div>

        {/* Barra de XP */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-bold text-[#1A1A1A]">Nível {level}</span>
            <span className="text-[#6B7280]">{user.xp} XP</span>
          </div>
          <div className="h-3 bg-[#F0F0F0] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-[#E50914] rounded-full"
            />
          </div>
        </div>

        {/* --- BOTÃO DO PROFESSOR (Inserido aqui dentro) --- */}
        {user.email === ADMIN_EMAIL && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin')}
            className="w-full mt-4 bg-[#1A1A1A] text-white py-3 px-4 rounded-xl font-bold border-l-4 border-[#F59E0B] flex items-center justify-between hover:bg-black transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>👑</span>
              <span className="text-sm">Painel do Professor</span>
            </div>
            <svg className="w-5 h-5 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
        {/* ------------------------------------------------ */}

      </motion.div>

      {/* Continue ouvindo - só aparece se tiver dados reais */}
      {continueEpisode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate(continueEpisode.url)}
          className="bg-[#1A1A1A] rounded-2xl p-4 shadow-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors"
        >
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-3">Continue ouvindo</p>
          <div className="flex gap-4">
            <img 
              src={continueEpisode.coverImage}
              alt={continueEpisode.seriesTitle}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-white font-bold">{continueEpisode.seriesTitle}</h3>
              <p className="text-[#6B7280] text-sm">{continueEpisode.episodeTitle}</p>
              <div className="mt-2">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#E50914] rounded-full"
                    style={{ width: `${continueEpisode.progress}%` }}
                  />
                </div>
                <p className="text-[#6B7280] text-xs mt-1">
                  {continueEpisode.questionsAnswered}/{continueEpisode.totalQuestions} perguntas
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}