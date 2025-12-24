/**
 * SISTEMA DE BADGES v2 - CADA UM DEVE SER MERECIDO
 * 
 * REGRAS:
 * 1. NUNCA dar mais de 1 badge por ação
 * 2. Prioridade definida - se conquistar múltiplos, só o mais importante aparece
 * 3. Os outros ficam em fila para próximas ações
 * 4. Cada badge deve ser DIFÍCIL de conseguir
 */

// ============================================
// DEFINIÇÕES DOS BADGES
// ============================================
export const BADGE_DEFINITIONS = {
  // === PROGRESSO (ordem de dificuldade) ===
  first_steps: {
    id: 'first_steps',
    name: 'Primeiro Passo',
    icon: '🌱',
    description: 'Completou seu primeiro episódio',
    priority: 1, // Menor = mais importante (aparece primeiro)
    category: 'progress'
  },
  
  bookworm: {
    id: 'bookworm',
    name: 'Leitor',
    icon: '📖',
    description: 'Completou sua primeira série inteira',
    priority: 2,
    category: 'progress'
  },
  
  scholar: {
    id: 'scholar',
    name: 'Estudioso',
    icon: '📚',
    description: 'Completou 5 séries',
    priority: 3,
    category: 'progress'
  },

  // === EXCELÊNCIA ===
  sharp_ear: {
    id: 'sharp_ear',
    name: 'Ouvido Afiado',
    icon: '🎯',
    description: '100% em um ditado',
    priority: 10,
    category: 'excellence'
  },
  
  diamond_collector: {
    id: 'diamond_collector',
    name: 'Colecionador',
    icon: '💎',
    description: 'Diamante em 3 séries diferentes',
    priority: 11,
    category: 'excellence'
  },
  
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfeccionista',
    icon: '👑',
    description: 'Diamante em 5 séries',
    priority: 12,
    category: 'excellence'
  },

  // === CONSISTÊNCIA ===
  on_fire: {
    id: 'on_fire',
    name: 'Em Chamas',
    icon: '🔥',
    description: '7 dias seguidos',
    priority: 20,
    category: 'consistency'
  },
  
  dedicated: {
    id: 'dedicated',
    name: 'Dedicado',
    icon: '💪',
    description: '30 dias seguidos',
    priority: 21,
    category: 'consistency'
  },
  
  unstoppable: {
    id: 'unstoppable',
    name: 'Imparável',
    icon: '⚡',
    description: '100 dias seguidos',
    priority: 22,
    category: 'consistency'
  },

  // === MILESTONES ===
  rising_star: {
    id: 'rising_star',
    name: 'Estrela Nascente',
    icon: '🚀',
    description: '1000 XP total',
    priority: 30,
    category: 'milestone'
  },
  
  expert: {
    id: 'expert',
    name: 'Expert',
    icon: '⭐',
    description: '5000 XP total',
    priority: 31,
    category: 'milestone'
  },
  
  legend: {
    id: 'legend',
    name: 'Lenda',
    icon: '🏆',
    description: '10000 XP total',
    priority: 32,
    category: 'milestone'
  }
}

// ============================================
// CONDIÇÕES PARA CADA BADGE
// ============================================
export const BADGE_CONDITIONS = {
  // Progresso
  first_steps: (ctx) => ctx.totalEpisodesCompleted >= 1,
  bookworm: (ctx) => ctx.totalSeriesCompleted >= 1,
  scholar: (ctx) => ctx.totalSeriesCompleted >= 5,
  
  // Excelência
  sharp_ear: (ctx) => ctx.hasAnyPerfectDictation === true,
  diamond_collector: (ctx) => ctx.seriesWithDiamond >= 3,
  perfectionist: (ctx) => ctx.seriesWithDiamond >= 5,
  
  // Consistência
  on_fire: (ctx) => ctx.streak >= 7,
  dedicated: (ctx) => ctx.streak >= 30,
  unstoppable: (ctx) => ctx.streak >= 100,
  
  // Milestones
  rising_star: (ctx) => ctx.xp >= 1000,
  expert: (ctx) => ctx.xp >= 5000,
  legend: (ctx) => ctx.xp >= 10000,
}

// ============================================
// FUNÇÃO PRINCIPAL - RETORNA NO MÁXIMO 1 BADGE
// ============================================
export function checkForNewBadge(context, currentBadges = []) {
  const newBadges = []
  
  // Verifica cada badge
  for (const [badgeId, condition] of Object.entries(BADGE_CONDITIONS)) {
    // Já tem esse badge? Pula
    if (currentBadges.includes(badgeId)) continue
    
    // Verifica condição
    if (condition(context)) {
      newBadges.push(badgeId)
    }
  }
  
  // Se não conquistou nenhum, retorna null
  if (newBadges.length === 0) return null
  
  // Se conquistou múltiplos, retorna SÓ O DE MAIOR PRIORIDADE
  // (menor número = maior prioridade)
  newBadges.sort((a, b) => {
    const priorityA = BADGE_DEFINITIONS[a]?.priority || 999
    const priorityB = BADGE_DEFINITIONS[b]?.priority || 999
    return priorityA - priorityB
  })
  
  // Retorna apenas o mais importante
  return newBadges[0]
}

// ============================================
// HELPER PARA CONSTRUIR CONTEXTO
// ============================================
export function buildBadgeContext(userData, additionalContext = {}) {
  return {
    xp: userData?.xp || 0,
    streak: userData?.streak || 0,
    totalEpisodesCompleted: userData?.totalEpisodesCompleted || 0,
    totalSeriesCompleted: userData?.totalSeriesCompleted || 0,
    seriesWithDiamond: userData?.seriesWithDiamond || 0,
    hasAnyPerfectDictation: userData?.hasAnyPerfectDictation || false,
    ...additionalContext
  }
}