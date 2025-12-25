/**
 * SISTEMA DE BADGES v7 - PLAYSTATION PLATINUM STYLE
 * * Filosofia: "Menos é Mais". Apenas conquistas que dão orgulho.
 * Som: Badges com 'isEpic: true' tocam o som de Platina.
 */

// ============================================
// DEFINIÇÕES (O MANUAL DO JOGO)
// ============================================
export const BADGE_DEFINITIONS = {
  // === 1. O GATILHO (Início Imediato) ===
  sharp_ear: {
    id: 'sharp_ear',
    name: 'Ouvido Afiado',
    icon: '👂',
    description: 'Seu primeiro 100% em um ditado. Você ouve cada detalhe!',
    priority: 10,
    category: 'excellence',
    isEpic: true // 🔊 SOM DE PLATINA
  },
  
  on_fire: {
    id: 'on_fire',
    name: 'Em Chamas',
    icon: '🔥',
    description: '3 dias seguidos. O hábito começou.',
    priority: 9,
    category: 'consistency',
    isEpic: false // 🔉 Som Normal
  },

  // === 2. A CONFIRMAÇÃO (Primeiras Séries) ===
  diamond_hunter: {
    id: 'diamond_hunter',
    name: 'Caçador de Diamantes',
    icon: '💎',
    description: 'Sua Primeira Série Diamante (Média > 95%).',
    priority: 8,
    category: 'excellence',
    isEpic: true // 🔊 SOM DE PLATINA
  },

  rising_star: {
    id: 'rising_star',
    name: 'Estrela',
    icon: '🚀',
    description: '500 XP acumulados. Você está decolando.',
    priority: 7,
    category: 'milestone',
    isEpic: false // 🔉 Som Normal
  },

  // === 3. A ELITE (Longo Prazo) ===
  precision_master: {
    id: 'precision_master',
    name: 'Mestre da Precisão',
    icon: '🎯',
    description: '3 Séries Diamante. Consistência absurda.',
    priority: 5,
    category: 'excellence',
    isEpic: true // 🔊 SOM DE PLATINA
  },

  scholar: {
    id: 'scholar',
    name: 'Acadêmico',
    icon: '📚',
    description: 'Completou 5 Séries inteiras (Ouro ou Diamante).',
    priority: 4,
    category: 'progress',
    isEpic: false // 🔉 Som Normal
  },

  collector: { // O antigo "Legend"
    id: 'collector',
    name: 'Colecionador',
    icon: '👑',
    description: '5 Séries Diamante. Você zerou o jogo atual.',
    priority: 1, // Prioridade MÁXIMA
    category: 'excellence',
    isEpic: true // 🔊 SOM DE PLATINA
  }
}

// ============================================
// CONDIÇÕES (AS REGRAS)
// ============================================
export const BADGE_CONDITIONS = {
  // Início
  sharp_ear: (ctx) => ctx.hasAnyPerfectDictation === true,
  on_fire: (ctx) => ctx.streak >= 3,
  
  // Intermediário
  diamond_hunter: (ctx) => ctx.seriesWithDiamond >= 1,
  rising_star: (ctx) => ctx.xp >= 500,

  // Elite
  precision_master: (ctx) => ctx.seriesWithDiamond >= 3,
  scholar: (ctx) => ctx.totalSeriesCompleted >= 5,
  collector: (ctx) => ctx.seriesWithDiamond >= 5
}

// ============================================
// LÓGICA DE VERIFICAÇÃO
// ============================================
export function checkForNewBadge(context, currentBadges = []) {
  const newBadges = []
  
  for (const [badgeId, condition] of Object.entries(BADGE_CONDITIONS)) {
    // Se já tem, ignora
    if (currentBadges.includes(badgeId)) continue
    
    try {
      if (condition(context)) {
        newBadges.push(badgeId)
      }
    } catch (e) {
      console.warn(`Erro ao verificar badge ${badgeId}`, e)
    }
  }
  
  if (newBadges.length === 0) return null
  
  // Se ganhou mais de um, escolhe o de MAIOR PRIORIDADE (menor número)
  // Ex: Se ganhar "Terminar Série" (Scholar) e "Diamante" (Collector) juntos,
  // mostra o Collector primeiro.
  newBadges.sort((a, b) => {
    const pA = BADGE_DEFINITIONS[a]?.priority || 999
    const pB = BADGE_DEFINITIONS[b]?.priority || 999
    return pA - pB
  })
  
  return newBadges[0]
}

// ============================================
// CONTEXT BUILDER
// ============================================
export function buildBadgeContext(userData, additionalContext = {}) {
  return {
    xp: userData?.xp || 0,
    streak: userData?.streak || 0,
    totalSeriesCompleted: userData?.totalSeriesCompleted || 0,
    seriesWithDiamond: userData?.seriesWithDiamond || 0,
    hasAnyPerfectDictation: userData?.hasAnyPerfectDictation || false,
    ...additionalContext
  }
}