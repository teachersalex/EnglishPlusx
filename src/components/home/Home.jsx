// src/components/home/Home.jsx
// Orquestrador da Home - só monta os pedaços
// ============================================

import { seriesByLevel } from '../../data/series'
import { useHome } from '../../hooks/useHome'

import Header from '../Header'
import UserStats from '../UserStats'
import WeeklyRankingCard from '../WeeklyRankingCard'
import OnboardingTour from '../OnboardingTour'

import SeriesRow from './SeriesRow'
import { GuestWelcome, TutorialMode } from './WelcomeSection'

// Steps do tour
const HOME_TOUR_STEPS = [
  {
    target: '[data-tour="welcome"]',
    emoji: '👋',
    title: 'Bem-vindo ao English Plus!',
    description: 'Sua comunidade exclusiva de inglês. Vou te mostrar como funciona em poucos passos.',
    position: 'bottom',
    allowClick: false,
  },
  {
    target: '[data-tour="tutorial-series"]',
    emoji: '🎯',
    title: 'Sua primeira série',
    description: 'Clique aqui para começar. É rápido e você vai aprender como usar o app.',
    position: 'bottom',
    allowClick: true,
    nextPage: 'series',
  },
]

export default function Home() {
  const {
    user,
    userData,
    isLoading,
    continueEpisode,
    showTour,
    tourStep,
    tutorialCompleted,
    completedSeriesIds,
    diamondSeries,
    handleSeriesClick,
    handleTourComplete,
    handleTourStepChange
  } = useHome()

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
        <p className="text-[#6B7280]">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* LOGADO + TUTORIAL COMPLETO */}
        {user && tutorialCompleted && (
          <>
            <UserStats user={userData} continueEpisode={continueEpisode} />
            
            <SeriesRow 
              title="The Pillars — A Base Sólida" 
              series={seriesByLevel.pillars || []} 
              onSeriesClick={handleSeriesClick} 
              diamondSeries={diamondSeries}
              completedSeriesIds={completedSeriesIds}
            />

            <SeriesRow 
              title="Starter — Pré-A1" 
              series={seriesByLevel.starter} 
              onSeriesClick={handleSeriesClick} 
              diamondSeries={diamondSeries}
              completedSeriesIds={completedSeriesIds}
            />
            
            <div className="mb-8">
              <WeeklyRankingCard />
            </div>
            
            <SeriesRow 
              title="Nível A1 — Iniciante" 
              series={seriesByLevel.a1} 
              onSeriesClick={handleSeriesClick}
              diamondSeries={diamondSeries}
              completedSeriesIds={completedSeriesIds}
            />
            
            <SeriesRow 
              title="Nível A2 — Básico" 
              series={seriesByLevel.a2} 
              onSeriesClick={handleSeriesClick}
              diamondSeries={diamondSeries}
              completedSeriesIds={completedSeriesIds}
            />
          </>
        )}

        {/* LOGADO + SEM TUTORIAL */}
        {user && !tutorialCompleted && (
          <TutorialMode userData={userData} onSeriesClick={handleSeriesClick} />
        )}

        {/* NÃO LOGADO */}
        {!user && (
          <>
            <GuestWelcome />
            
            <SeriesRow 
              title="The Pillars — A Base Sólida" 
              series={seriesByLevel.pillars || []} 
              onSeriesClick={handleSeriesClick} 
              diamondSeries={{}}
              completedSeriesIds={[]}
            />
            <SeriesRow 
              title="Starter — Pré-A1" 
              series={seriesByLevel.starter} 
              onSeriesClick={handleSeriesClick} 
              diamondSeries={{}}
              completedSeriesIds={[]}
            />
            <SeriesRow 
              title="Nível A1 — Iniciante" 
              series={seriesByLevel.a1} 
              onSeriesClick={handleSeriesClick}
              diamondSeries={{}}
              completedSeriesIds={[]}
            />
            <SeriesRow 
              title="Nível A2 — Básico" 
              series={seriesByLevel.a2} 
              onSeriesClick={handleSeriesClick}
              diamondSeries={{}}
              completedSeriesIds={[]}
            />
          </>
        )}
      </main>

      {/* Tour */}
      <OnboardingTour 
        steps={HOME_TOUR_STEPS}
        isActive={showTour}
        currentStep={tourStep}
        onStepChange={handleTourStepChange}
        onComplete={handleTourComplete}
      />
    </div>
  )
}