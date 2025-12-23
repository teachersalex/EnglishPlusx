import { seriesStarter } from './starter'
import { seriesA1 } from './a1'
import { seriesA2 } from './a2'
import { seriesPillars } from './pillars' // <--- 1. Importar

// Combina todas as séries (para as rotas funcionarem)
export const seriesData = {
  ...seriesPillars, // <--- 2. Adicionar aqui (coloco primeiro pra dar prioridade se ordenar por ID)
  ...seriesStarter,
  ...seriesA1,
  ...seriesA2
}

// Exporta separado por nível (para a Home renderizar as seções)
export const seriesByLevel = {
  pillars: Object.values(seriesPillars), // <--- 3. Nova categoria "Foundation"
  starter: Object.values(seriesStarter),
  a1: Object.values(seriesA1),
  a2: Object.values(seriesA2)
}