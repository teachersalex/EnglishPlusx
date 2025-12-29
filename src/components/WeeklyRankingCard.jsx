// src/components/WeeklyRankingCard.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getWeeklyRanking } from '../services/adminService'

// Fake users no topo (sempre aparecem)
const FAKE_LEADERS = [
  { id: 'fake1', name: 'Maria Claudia', diamonds: 12, precision: 98, weeklyTime: 272 },
  { id: 'fake2', name: 'João Fernando', diamonds: 10, precision: 97, weeklyTime: 195 },
]

function formatTime(minutes) {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function WeeklyRankingCard() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getWeeklyRanking()
        setRanking(data.ranking || [])
      } catch (e) {
        console.error('Erro ao carregar ranking:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Combina fakes + reais, máximo 5
  const fullRanking = [...FAKE_LEADERS, ...ranking].slice(0, 5)

  const getMedal = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}.`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#333] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <h2 className="text-white font-bold text-lg">Ranking da Semana</h2>
        </div>
      </div>

      {/* Header da tabela */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs text-[#6B7280] font-medium">
        <div className="col-span-5">Aluno</div>
        <div className="col-span-2 text-center">💎</div>
        <div className="col-span-2 text-center">%</div>
        <div className="col-span-3 text-right">Tempo</div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="px-4 py-8 text-center text-[#6B7280]">Carregando...</div>
      ) : fullRanking.length === 0 ? (
        <div className="px-4 py-8 text-center text-[#6B7280]">Nenhum dado ainda</div>
      ) : (
        fullRanking.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-t border-gray-50 ${
              index < 3 ? 'bg-gradient-to-r from-amber-50/50 to-transparent' : ''
            }`}
          >
            {/* Posição + Nome */}
            <div className="col-span-5 flex items-center gap-2">
              <span className={`text-lg ${index < 3 ? '' : 'text-[#6B7280] text-sm'}`}>
                {getMedal(index)}
              </span>
              <span className={`font-medium truncate ${index < 3 ? 'text-[#1A1A1A]' : 'text-[#6B7280]'}`}>
                {entry.name?.split(' ')[0]}
              </span>
            </div>

            {/* Diamantes */}
            <div className="col-span-2 text-center">
              <span className="text-[#1A1A1A] font-bold">{entry.diamonds}</span>
            </div>

            {/* Precisão */}
            <div className="col-span-2 text-center">
              <span className={`font-medium ${
                entry.precision >= 95 ? 'text-emerald-600' : 
                entry.precision >= 85 ? 'text-amber-600' : 'text-[#6B7280]'
              }`}>
                {entry.precision}%
              </span>
            </div>

            {/* Tempo */}
            <div className="col-span-3 text-right">
              <span className="text-[#6B7280] text-sm">{formatTime(entry.weeklyTime)}</span>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  )
}