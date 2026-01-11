// src/components/home/WelcomeSection.jsx
// Seções de boas-vindas condicionais
// ============================================
// 🔧 FIX v16: Trim check para edge case de nome vazio/whitespace

import { motion } from 'framer-motion'
import { seriesData, tutorialSeries } from '../../data/series'
import SeriesCard from './SeriesCard'

// Para visitantes não logados
export function GuestWelcome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
        Aprenda inglês com histórias imersivas
      </h1>
      <p className="text-[#6B7280] mb-6">Faça login para acompanhar seu progresso</p>
      <button
        onClick={() => document.querySelector('[data-login]')?.click()}
        className="bg-[#E50914] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#B20710] transition-colors"
      >
        Começar grátis
      </button>
    </motion.div>
  )
}

// Para usuários que ainda não fizeram o tutorial
export function TutorialMode({ userData, onSeriesClick }) {
  // 🔧 FIX: Extrai primeiro nome com validação de trim
  // Evita "Olá, !" quando name é "" ou "   "
  const firstName = userData?.name?.trim()?.split(' ')[0]
  const greeting = firstName ? `, ${firstName}` : ''

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-tour="welcome"
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          👋 Olá{greeting}! Vamos começar?
        </h1>
        <p className="text-[#6B7280]">
          Complete seu primeiro passo para desbloquear todas as séries.
        </p>
      </motion.div>

      {/* Série tutorial */}
      <div className="mb-8">
        <h2 className="text-[#1A1A1A] text-xl font-bold mb-4">
          Seu primeiro passo
        </h2>
        <div className="flex gap-4 px-1">
          <SeriesCard 
            series={tutorialSeries} 
            onClick={() => onSeriesClick(0)} 
            hasDiamond={false}
            isCompleted={false}
            isTutorial={true}
          />
        </div>
      </div>

      {/* Preview bloqueado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="text-center py-8 border-t border-gray-200"
      >
        <p className="text-[#6B7280] text-sm">
          🔒 Complete o tutorial para desbloquear {Object.values(seriesData).length - 1} séries
        </p>
      </motion.div>
    </>
  )
}