/**
 * SISTEMA DE BADGES v12 — PROGRESSÃO MUSICAL
 * Espaçamento correto: 1 badge por marco, nunca sobrepõe
 * 
 * Regras:
 * - 1 badge por ação (nunca sobrepõe)
 * - Prioridade: mais raro primeiro
 */

// ============================================
// DEFINIÇÕES (10 BADGES)
// ============================================
export const BADGE_DEFINITIONS = {
  // === TRILHA DOS DIAMANTES (ao completar série ≥95%) ===
  primeiro_diamante: {
    id: 'primeiro_diamante',
    name: 'Primeiro Diamante',
    icon: '💎',
    description: 'Sua primeira série com média ≥95% no ditado.',
    category: 'diamond',
    isEpic: true,
    requirement: { type: 'diamonds', count: 1 }
  },
  ouvido_afiado: {
    id: 'ouvido_afiado',
    name: 'Ouvido Afiado',
    icon: '👂',
    description: '2 séries com média ≥95%. Você ouve cada detalhe!',
    category: 'diamond',
    isEpic: true,
    requirement: { type: 'diamonds', count: 2 }
  },
  tres_diamantes: {
    id: 'tres_diamantes',
    name: 'Três Diamantes',
    icon: '💎',
    description: '3 séries diamante. Consistência absurda!',
    category: 'diamond',
    isEpic: true,
    requirement: { type: 'diamonds', count: 3 }
  },
  lenda: {
    id: 'lenda',
    name: 'Lenda',
    icon: '🏆',
    description: '5 séries diamante. Você zerou o jogo!',
    category: 'diamond',
    isEpic: true,
    requirement: { type: 'diamonds', count: 5 }
  },

  // === TRILHA DE PRECISÃO (ao fazer ditado 100%) ===
  mao_quente: {
    id: 'mao_quente',
    name: 'Mão Quente',
    icon: '🔥',
    description: '15 ditados perfeitos. Você está no flow!',
    category: 'precision',
    isEpic: false,
    requirement: { type: 'perfectDictations', count: 15 }
  },
  vinte_cinco_perfeitos: {
    id: 'vinte_cinco_perfeitos',
    name: 'Vinte e Cinco Perfeitos',
    icon: '🎯',
    description: '25 ditados 100%. Precisão cirúrgica!',
    category: 'precision',
    isEpic: true,
    requirement: { type: 'perfectDictations', count: 25 }
  },

  // === TRILHA DE VOLUME (ao completar série) ===
  quatro_series: {
    id: 'quatro_series',
    name: 'Quatro Séries',
    icon: '📚',
    description: '4 séries completas. Você está voando!',
    category: 'volume',
    isEpic: false,
    requirement: { type: 'seriesCompleted', count: 4 }
  },
  seis_series: {
    id: 'seis_series',
    name: 'Seis Séries',
    icon: '📚',
    description: '6 séries completas. Dedicação admirável!',
    category: 'volume',
    isEpic: false,
    requirement: { type: 'seriesCompleted', count: 6 }
  },
  dez_series: {
    id: 'dez_series',
    name: 'Dez Séries',
    icon: '📚',
    description: '10 séries completas. Veterano!',
    category: 'volume',
    isEpic: true,
    requirement: { type: 'seriesCompleted', count: 10 }
  },

  // === TRILHA DE QUIZ ===
  quiz_master: {
    id: 'quiz_master',
    name: 'Quiz Master',
    icon: '🧠',
    description: '15 quizzes perfeitos. Cérebro afiado!',
    category: 'quiz',
    isEpic: true,
    requirement: { type: 'perfectQuizzes', count: 15 }
  }
}

// Ordem de exibição na vitrine
export const BADGE_DISPLAY_ORDER = [
  'primeiro_diamante',
  'ouvido_afiado',
  'tres_diamantes',
  'lenda',
  'mao_quente',
  'vinte_cinco_perfeitos',
  'quiz_master',
  'quatro_series',
  'seis_series',
  'dez_series'
]

// ============================================
// CHECKERS POR TRIGGER
// ============================================

/**
 * Ao completar SÉRIE (verifica diamantes E volume)
 * Prioridade: Diamante > Volume
 */
export function checkSeriesCompletionBadge(context, currentBadges = []) {
  const { seriesWithDiamond, totalSeriesCompleted } = context
  
  // Trilha dos Diamantes (prioridade: mais raro primeiro)
  if (seriesWithDiamond >= 5 && !currentBadges.includes('lenda')) {
    return 'lenda'
  }
  if (seriesWithDiamond >= 3 && !currentBadges.includes('tres_diamantes')) {
    return 'tres_diamantes'
  }
  if (seriesWithDiamond >= 2 && !currentBadges.includes('ouvido_afiado')) {
    return 'ouvido_afiado'
  }
  if (seriesWithDiamond >= 1 && !currentBadges.includes('primeiro_diamante')) {
    return 'primeiro_diamante'
  }
  
  // Trilha de Volume (só se não ganhou diamante)
  if (totalSeriesCompleted >= 10 && !currentBadges.includes('dez_series')) {
    return 'dez_series'
  }
  if (totalSeriesCompleted >= 6 && !currentBadges.includes('seis_series')) {
    return 'seis_series'
  }
  if (totalSeriesCompleted >= 4 && !currentBadges.includes('quatro_series')) {
    return 'quatro_series'
  }
  
  return null
}

/**
 * Ao fazer DITADO 100%
 */
export function checkDictationBadge(context, currentBadges = []) {
  const { perfectDictationCount } = context
  
  if (perfectDictationCount >= 25 && !currentBadges.includes('vinte_cinco_perfeitos')) {
    return 'vinte_cinco_perfeitos'
  }
  if (perfectDictationCount >= 15 && !currentBadges.includes('mao_quente')) {
    return 'mao_quente'
  }
  
  return null
}

/**
 * Ao completar QUIZ 100%
 */
export function checkQuizBadge(context, currentBadges = []) {
  const { perfectQuizCount } = context
  
  if (perfectQuizCount >= 15 && !currentBadges.includes('quiz_master')) {
    return 'quiz_master'
  }
  
  return null
}

// ============================================
// HELPERS PARA PROGRESSO
// ============================================

/**
 * Retorna o progresso atual para cada badge
 * Usado para mostrar "3/5" nos badges bloqueados
 */
export function getBadgeProgress(badgeId, userData) {
  const badge = BADGE_DEFINITIONS[badgeId]
  if (!badge?.requirement) return null
  
  const { type, count } = badge.requirement
  let current = 0
  
  switch (type) {
    case 'diamonds':
      current = userData?.seriesWithDiamond || 0
      break
    case 'perfectDictations':
      current = userData?.perfectDictationCount || 0
      break
    case 'seriesCompleted':
      current = userData?.totalSeriesCompleted || 0
      break
    case 'perfectQuizzes':
      current = userData?.perfectQuizCount || 0
      break
    default:
      return null
  }
  
  return {
    current: Math.min(current, count),
    total: count,
    percentage: Math.min(100, Math.round((current / count) * 100))
  }
}

// ============================================
// CONTEXT BUILDER
// ============================================
export function buildBadgeContext(userData, additionalContext = {}) {
  return {
    seriesWithDiamond: userData?.seriesWithDiamond || 0,
    totalSeriesCompleted: userData?.totalSeriesCompleted || 0,
    perfectDictationCount: userData?.perfectDictationCount || 0,
    perfectQuizCount: userData?.perfectQuizCount || 0,
    ...additionalContext
  }
}