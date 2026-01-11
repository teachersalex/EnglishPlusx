// src/contexts/GamificationContext.jsx
// Badges e diamonds
// ============================================

import { createContext, useContext, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useUserData } from './UserDataContext'
import { gamificationService } from '../services/gamificationService'
import { diamondService } from '../services/diamondService'
import { BADGE_DEFINITIONS } from '../utils/badgeSystem'

export { BADGE_DEFINITIONS }

const GamificationContext = createContext()

export function useGamification() {
  return useContext(GamificationContext)
}

export function GamificationProvider({ children }) {
  const { user } = useAuth()
  const { userData, setUserData } = useUserData()

  // ========== BADGES ==========

  const getUserBadges = useCallback(async () => {
    if (!user) return []
    return gamificationService.getUserBadges(user.uid)
  }, [user])

  const addBadge = useCallback(async (badgeId) => {
    if (!user || !badgeId) return false
    
    const success = await gamificationService.addBadge(user.uid, badgeId)
    if (success) {
      setUserData(prev => ({
        ...prev,
        badges: [...(prev?.badges || []), badgeId]
      }))
    }
    return success
  }, [user, setUserData])

  // ========== DIAMONDS ==========

  const checkSeriesDiamond = useCallback(async (seriesId, totalEpisodes) => {
    if (!user) return false
    return diamondService.checkSeriesDiamond(user.uid, seriesId, totalEpisodes)
  }, [user])

  const getDiamondSeries = useCallback(async (seriesData) => {
    if (!user) return {}
    return diamondService.getDiamondSeries(user.uid, seriesData)
  }, [user])

  // ========== COMPUTED ==========

  const badges = userData?.badges || []
  const diamondCount = userData?.seriesWithDiamond || 0
  const diamondSeriesIds = userData?.diamondSeriesIds || []

  // ========== CONTEXT VALUE ==========

  const value = {
    // Badges
    badges,
    getUserBadges,
    addBadge,
    BADGE_DEFINITIONS,
    
    // Diamonds
    diamondCount,
    diamondSeriesIds,
    checkSeriesDiamond,
    getDiamondSeries
  }

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  )
}
