// src/contexts/index.js
// Re-exporta todos os contexts para manter compatibilidade
// ============================================

// Contexts individuais
export { AuthProvider, useAuth } from './AuthContext'
export { UserDataProvider, useUserData } from './UserDataContext'
export { ProgressProvider, useProgress } from './ProgressContext'
export { GamificationProvider, useGamification, BADGE_DEFINITIONS } from './GamificationContext'

// ============================================
// PROVIDER COMBINADO (para App.jsx)
// ============================================

import { AuthProvider } from './AuthContext'
import { UserDataProvider } from './UserDataContext'
import { ProgressProvider } from './ProgressContext'
import { GamificationProvider } from './GamificationContext'

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <UserDataProvider>
        <ProgressProvider>
          <GamificationProvider>
            {children}
          </GamificationProvider>
        </ProgressProvider>
      </UserDataProvider>
    </AuthProvider>
  )
}

// ============================================
// HOOK COMBINADO (compatibilidade com código antigo)
// ============================================

import { useAuth } from './AuthContext'
import { useUserData } from './UserDataContext'
import { useProgress } from './ProgressContext'
import { useGamification } from './GamificationContext'

/**
 * Hook de compatibilidade que combina todos os contexts
 * Use hooks individuais em código novo para melhor performance
 * 
 * @deprecated Prefira usar useAuth, useUserData, useProgress, useGamification
 */
export function useAppContext() {
  const auth = useAuth()
  const userData = useUserData()
  const progress = useProgress()
  const gamification = useGamification()

  return {
    // Auth
    user: auth.user,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    login: auth.login,
    signup: auth.signup,
    loginWithGoogle: auth.loginWithGoogle,
    logout: async () => {
      await userData.saveTimeBeforeLogout()
      await auth.logout()
    },

    // User Data
    userData: userData.userData,
    updateUserXP: userData.updateUserXP,
    updateStreak: userData.updateStreak,

    // Progress
    saveProgress: progress.saveProgress,
    getProgress: progress.getProgress,
    getLastProgress: progress.getLastProgress,
    getSeriesProgress: progress.getSeriesProgress,
    saveDictationScore: progress.saveDictationScore,
    saveQuizScore: progress.saveQuizScore,
    saveTranscription: progress.saveTranscription,
    getTranscriptions: progress.getTranscriptions,

    // Gamification
    getUserBadges: gamification.getUserBadges,
    checkSeriesDiamond: gamification.checkSeriesDiamond,
    getDiamondSeries: gamification.getDiamondSeries,
    BADGE_DEFINITIONS: gamification.BADGE_DEFINITIONS
  }
}
