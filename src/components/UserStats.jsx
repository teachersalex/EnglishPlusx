import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext' // <--- Importamos a fonte segura

export default function UserStats({ user, continueEpisode }) {
  const navigate = useNavigate()
  const { user: authUser } = useAuth() // <--- Pegamos o usuário real do Login (Google)
  
  if (!user) return null

  // --- CONFIGURAÇÃO DE SEGURANÇA BLINDADA ---
  const ADMIN_EMAILS = [
    "alexmg@gmail.com",
    "alexsbd85@gmail.com",
    "alexalienmg@gmail.com",
    "alexpotterbd@gmail.com"
  ]

  // 1. Pega o email da fonte segura (Auth) e não do banco de dados
  // 2. Converte para minúsculas para não ter erro de digitação
  const safeEmail = authUser?.email ? authUser.email.toLowerCase() : ''
  
  // 3. Verifica se está na lista
  const isAdmin = ADMIN_EMAILS.includes(safeEmail)
  // ------------------------------------------
  
  // Calcula nível
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
            <p className="text-[#6B7280] text-sm flex items-center gap-1">
              {/* Mostra o email real para você conferir visualmente */}
              {safeEmail}
              {isAdmin && <span className="text-[#F59E0B] text-[10px] border border-[#F59E0B] px-1 rounded ml-1">ADMIN</span>}
            </p>
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

        {/* --- BOTÃO DO PROFESSOR (Agora usando safeEmail) --- */}
        {isAdmin && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin')}
            className="w-full mt-4 bg-[#1A1A1A] text-white py-3 px-4 rounded-xl font-bold border-l-4 border-[#F59E0B] flex items-center justify-between hover:bg-black transition-colors shadow-lg"
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
        
        {/* DEBUG: Se não for admin, avisa o porquê (só pra você ver) */}
        {!isAdmin && (
          <div className="mt-2 text-[10px] text-gray-400 text-center">
            Logado como: {safeEmail} (Não reconhecido como Admin)
          </div>
        )}
        {/* ------------------------------------------------ */}

      </motion.div>

      {/* Continue ouvindo */}
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