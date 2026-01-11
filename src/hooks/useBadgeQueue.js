// src/hooks/useBadgeQueue.js
// Gerencia fila de badges para celebração sequencial
// ============================================

import { useState, useEffect, useCallback } from 'react'

export function useBadgeQueue() {
  const [badgeQueue, setBadgeQueue] = useState([])
  const [activeBadge, setActiveBadge] = useState(null)

  // Processa próximo badge da fila quando não há badge ativo
  useEffect(() => {
    if (!activeBadge && badgeQueue.length > 0) {
      const [next, ...rest] = badgeQueue
      setActiveBadge(next)
      setBadgeQueue(rest)
    }
  }, [activeBadge, badgeQueue])

  // Adiciona badge à fila (com deduplicação)
  const queueBadge = useCallback((badge) => {
    if (badge && typeof badge === 'string') {
      setBadgeQueue(prev => {
        // Evita duplicatas
        if (prev.includes(badge) || badge === activeBadge) {
          return prev
        }
        return [...prev, badge]
      })
    }
  }, [activeBadge])

  // Adiciona múltiplos badges
  const queueBadges = useCallback((badges) => {
    const validBadges = badges.filter(b => b && typeof b === 'string')
    if (validBadges.length === 0) return

    setBadgeQueue(prev => {
      const uniqueNew = validBadges.filter(
        b => !prev.includes(b) && b !== activeBadge
      )
      return [...prev, ...uniqueNew]
    })
  }, [activeBadge])

  // Marca badge atual como completo
  const completeBadge = useCallback(() => {
    setActiveBadge(null)
  }, [])

  // Limpa tudo (para reset de episódio)
  const clearQueue = useCallback(() => {
    setBadgeQueue([])
    setActiveBadge(null)
  }, [])

  // Verifica se há badges pendentes
  const hasPendingBadges = badgeQueue.length > 0 || activeBadge !== null

  return {
    activeBadge,
    badgeQueue,
    hasPendingBadges,
    queueBadge,
    queueBadges,
    completeBadge,
    clearQueue
  }
}
