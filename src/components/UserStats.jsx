import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function UserStats({ user, continueEpisode }) {
  const navigate = useNavigate()
  const { user: authUser } = useAuth() // Pega o usuário direto do Google (Login)
  
  // Se não tiver dados do banco ainda, retorna nulo (padrão)
  if (!user) return null

  // --- DEBUG FORCE (MOSTRA TUDO) ---
  const googleEmail = authUser?.email || "Não detectado"
  const firestoreEmail = user.email || "Não salvo no banco"
  // --------------------------------

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
            <p className="text-[#6B7280] text-sm">Nível {level}</p>
          </div>
          <div className="text-right">
            <p className="text-[#E50914] font-bold text-lg">{user.streak} dias</p>
            <p className="text-[#6B7280] text-xs">seguidos</p>
          </div>
        </div>

        {/* Barra de XP */}
        <div className="mb-4">
          <div className="h-3 bg-[#F0F0F0] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              className="h-full bg-[#E50914] rounded-full"
            />
          </div>
        </div>

        {/* ================================================== */}
        {/* 🕵️ ÁREA DE DEBUG (VAI APARECER UMA CAIXA AMARELA) */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-3 mb-4 text-xs font-mono">
          <p className="font-bold">DIAGNÓSTICO:</p>
          <p>📧 Email Google (Auth): {googleEmail}</p>
          <p>💾 Email Banco (User): {firestoreEmail}</p>
        </div>
        {/* ================================================== */}

        {/* 🚨 BOTÃO SEM TRAVA (TEM QUE APARECER) 🚨 */}
        <button
          onClick={() => navigate('/admin')}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <span>🛠️</span>
          <span>ENTRAR NO PAINEL (FORÇADO)</span>
        </button>

      </motion.div>

      {/* Continue ouvindo */}
      {continueEpisode && (
        <div 
          onClick={() => navigate(continueEpisode.url)}
          className="bg-[#1A1A1A] rounded-2xl p-4 shadow-lg cursor-pointer mt-4"
        >
          <p className="text-white font-bold text-sm">Continuar: {continueEpisode.seriesTitle}</p>
        </div>
      )}
    </div>
  )
}