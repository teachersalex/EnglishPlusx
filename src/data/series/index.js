import { seriesStarter } from './starter'
import { seriesA1 } from './a1'
import { seriesA2 } from './a2'

// Combina todas as séries
export const seriesData = {
  ...seriesStarter,
  ...seriesA1,
  ...seriesA2
}

// Exporta separado por nível (para a Home)
export const seriesByLevel = {
  starter: Object.values(seriesStarter),
  a1: Object.values(seriesA1),
  a2: Object.values(seriesA2)
}
