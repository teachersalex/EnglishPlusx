/**
 * SISTEMA DE BADGES v13 — EXPANSÃO
 * 18 badges no total (10 originais + 8 novas)
 * 
 * Regras:
 * - 1 badge por ação (nunca sobrepõe)
 * - Prioridade: mais raro primeiro
 */

// ============================================
// DEFINIÇÕES (18 BADGES)
// ============================================
export const BADGE_DEFINITIONS = {
  // === TRILHA DOS DIAMANTES (ao completar série ≥95%) ===
  primeiro_diamante: {
    id: 'primeiro_diamante',
    name: 'Primeiro Diamante',
    icon: '💎',
    description: 'Sua primeira série com média ≥95% no ditado.',
    category: 'diamond',
    isEpic: false,
    requirement: { type: 'diamonds', count: 1 }
  },
  ouvido_afiado: {
    id: 'ouvido_afiado',
    name: 'Ouvido Afiado',
    icon: '👂',
    description: '2 séries com média ≥95%. Você ouve cada detalhe!',
    category: 'diamond',
    isEpic: false,
    requirement: { type: 'diamonds', count: 2 }
  },
  tres_diamantes: {
    id: 'tres_diamantes',
    name: 'Três Diamantes',
    icon: '💎',
    description: '3 séries diamante. Consistência absurda!',
    category: 'diamond',
    isEpic: false,
    requirement: { type: 'diamonds', count: 3 }
  },
  lenda: {
    id: 'lenda',
    name: 'Lenda',
    icon: '🏆',
    description: '5 séries diamante. Você é uma lenda!',
    category: 'diamond',
    isEpic: true,
    requirement: { type: 'diamonds', count: 5 }
  },
  diamante_supremo: {
    id: 'diamante_supremo',
    name: 'Diamante Supremo',
    icon: '👑',
    description: '7 séries diamante. Nível supremo alcançado!',
    category: 'diamond',
    isEpic: true,
    requirement: { type: 'diamonds', count: 7 }
  },
  dez_diamantes: {
    id: 'dez_diamantes',
    name: 'Dez Diamantes',
    icon: '💎',
    description: '10 séries diamante. Colecionador de diamantes!',
    category: 'diamond',
    isEpic: true,
    requirement: { type: 'diamonds', count: 10 }
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
  cinquenta_perfeitos: {
    id: 'cinquenta_perfeitos',
    name: 'Cinquenta Perfeitos',
    icon: '💯',
    description: '50 ditados 100%. Ouvido de elite!',
    category: 'precision',
    isEpic: true,
    requirement: { type: 'perfectDictations', count: 50 }
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
  oito_series: {
    id: 'oito_series',
    name: 'Oito Séries',
    icon: '📖',
    description: '8 séries completas. Quase lá!',
    category: 'volume',
    isEpic: false,
    requirement: { type: 'seriesCompleted', count: 8 }
  },
  onze_series: {
    id: 'onze_series',
    name: 'Onze Séries',
    icon: '🎓',
    description: '11 séries completas. Veterano!',
    category: 'volume',
    isEpic: true,
    requirement: { type: 'seriesCompleted', count: 11 }
  },
  treze_series: {
    id: 'treze_series',
    name: 'Treze Séries',
    icon: '📚',
    description: '13 séries completas. Dedicação total!',
    category: 'volume',
    isEpic: true,
    requirement: { type: 'seriesCompleted', count: 13 }
  },
  dezesseis_series: {
    id: 'dezesseis_series',
    name: 'Dezesseis Séries',
    icon: '🏅',
    description: '16 séries completas. Mestre do English+!',
    category: 'volume',
    isEpic: true,
    requirement: { type: 'seriesCompleted', count: 16 }
  },

  // === TRILHA DE QUIZ ===
  quiz_master: {
    id: 'quiz_master',
    name: 'Quiz Master',
    icon: '🧠',
    description: '15 quizzes perfeitos. Cérebro afiado!',
    category: 'quiz',
    isEpic: false,
    requirement: { type: 'perfectQuizzes', count: 15 }
  },
  trinta_quizzes: {
    id: 'trinta_quizzes',
    name: 'Trinta Quizzes',
    icon: '🧠',
    description: '30 quizzes perfeitos. Mente brilhante!',
    category: 'quiz',
    isEpic: true,
    requirement: { type: 'perfectQuizzes', count: 30 }
  },

  // === TRILHA DE CONSISTÊNCIA (streak) ===
  semana_perfeita: {
    id: 'semana_perfeita',
    name: 'Semana Perfeita',
    icon: '📅',
    description: '7 dias seguidos estudando. Consistência é tudo!',
    category: 'streak',
    isEpic: true,
    requirement: { type: 'streak', count: 7 }
  }
}

// Ordem de exibição na vitrine (agrupado por categoria)
export const BADGE_DISPLAY_ORDER = [
  // Diamantes (6)
  'primeiro_diamante',
  'ouvido_afiado',
  'tres_diamantes',
  'lenda',
  'diamante_supremo',
  'dez_diamantes',
  // Precisão (3)
  'mao_quente',
  'vinte_cinco_perfeitos',
  'cinquenta_perfeitos',
  // Quiz (2)
  'quiz_master',
  'trinta_quizzes',
  // Volume (6)
  'quatro_series',
  'seis_series',
  'oito_series',
  'onze_series',
  'treze_series',
  'dezesseis_series',
  // Streak (1)
  'semana_perfeita'
]

// ============================================
// CHECKERS POR TRIGGER
// ============================================

/**
 * Ao completar SÉRIE (verifica diamantes E volume)
 * v14: Retorna ARRAY de badges (pode dar duas se inevitável)
 */
export function checkSeriesCompletionBadge(context, currentBadges = []) {
  const { seriesWithDiamond, totalSeriesCompleted } = context
  const badges = []
  
  // Trilha dos Diamantes (só a mais alta pendente)
  if (seriesWithDiamond >= 10 && !currentBadges.includes('dez_diamantes')) {
    badges.push('dez_diamantes')
  } else if (seriesWithDiamond >= 7 && !currentBadges.includes('diamante_supremo')) {
    badges.push('diamante_supremo')
  } else if (seriesWithDiamond >= 5 && !currentBadges.includes('lenda')) {
    badges.push('lenda')
  } else if (seriesWithDiamond >= 3 && !currentBadges.includes('tres_diamantes')) {
    badges.push('tres_diamantes')
  } else if (seriesWithDiamond >= 2 && !currentBadges.includes('ouvido_afiado')) {
    badges.push('ouvido_afiado')
  } else if (seriesWithDiamond >= 1 && !currentBadges.includes('primeiro_diamante')) {
    badges.push('primeiro_diamante')
  }
  
  // Trilha de Volume (só a mais alta pendente)
  if (totalSeriesCompleted >= 16 && !currentBadges.includes('dezesseis_series')) {
    badges.push('dezesseis_series')
  } else if (totalSeriesCompleted >= 13 && !currentBadges.includes('treze_series')) {
    badges.push('treze_series')
  } else if (totalSeriesCompleted >= 11 && !currentBadges.includes('onze_series')) {
    badges.push('onze_series')
  } else if (totalSeriesCompleted >= 8 && !currentBadges.includes('oito_series')) {
    badges.push('oito_series')
  } else if (totalSeriesCompleted >= 6 && !currentBadges.includes('seis_series')) {
    badges.push('seis_series')
  } else if (totalSeriesCompleted >= 4 && !currentBadges.includes('quatro_series')) {
    badges.push('quatro_series')
  }
  
  return badges.length > 0 ? badges : null
}

/**
 * Ao fazer DITADO 100%
 */
export function checkDictationBadge(context, currentBadges = []) {
  const { perfectDictationCount } = context
  
  // Prioridade: mais raro primeiro
  if (perfectDictationCount >= 50 && !currentBadges.includes('cinquenta_perfeitos')) {
    return 'cinquenta_perfeitos'
  }
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
  
  // Prioridade: mais raro primeiro
  if (perfectQuizCount >= 30 && !currentBadges.includes('trinta_quizzes')) {
    return 'trinta_quizzes'
  }
  if (perfectQuizCount >= 15 && !currentBadges.includes('quiz_master')) {
    return 'quiz_master'
  }
  
  return null
}

/**
 * Ao atualizar STREAK
 */
export function checkStreakBadge(context, currentBadges = []) {
  const { streak } = context
  
  if (streak >= 7 && !currentBadges.includes('semana_perfeita')) {
    return 'semana_perfeita'
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
    case 'streak':
      current = userData?.streak || 0
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
    streak: userData?.streak || 0,
    ...additionalContext
  }
}