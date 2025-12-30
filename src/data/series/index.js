// src/data/series/index.js

// === 0. Tutorial (Onboarding) ===
import { seriesFirstSteps } from './tutorial/000-first-steps.js'

// === 1. The Pillars (Foundation) ===
import { seriesNumbers } from './pillars/101-numbers.js'
import { seriesPeople } from './pillars/102-people.js'
import { seriesTime } from './pillars/103-time.js'
import { seriesWorld } from './pillars/104-world.js'
import { seriesActions } from './pillars/105-actions.js'

// === 2. Starter (Pré-A1) ===
import { seriesFirstDay } from './starter/002-first-day.js'
import { seriesMysteryBox } from './starter/003-mystery-box.js'
import { seriesPhotograph } from './starter/007-photograph.js'
import { seriesFashionBoss } from './starter/008-fashion-boss.js'
import { seriesBadDate } from './starter/009-bad-date.js'
import { seriesGossipNeighbor } from './starter/010-gossip-neighbor.js'
import { seriesFakeLife } from './starter/011-fake-life.js'
import { seriesParisTrip } from './starter/012-paris-trip.js'

// === 3. Level A1 (Beginner) ===
import { seriesMidnightKey } from './a1/001-midnight-key.js'
import { seriesWrongPhone } from './a1/004-wrong-phone.js'
import { seriesRedLipstick } from './a1/005-red-lipstick.js'
import { seriesDoctorsSecret } from './a1/006-doctors-secret.js'

// === COMBINA TUDO (Para rotas e acesso direto por ID) ===
export const seriesData = {
  // Tutorial
  ...seriesFirstSteps,
  
  // Pillars
  ...seriesNumbers,
  ...seriesPeople,
  ...seriesTime,
  ...seriesWorld,
  ...seriesActions,
  
  // Starter
  ...seriesFirstDay,
  ...seriesMysteryBox,
  ...seriesPhotograph,
  ...seriesFashionBoss,
  ...seriesBadDate,
  ...seriesGossipNeighbor,
  ...seriesFakeLife,
  ...seriesParisTrip,
  
  // A1
  ...seriesMidnightKey,
  ...seriesWrongPhone,
  ...seriesRedLipstick,
  ...seriesDoctorsSecret,
}

// === TUTORIAL (separado para lógica de onboarding) ===
export const tutorialSeries = seriesFirstSteps[0]

// === EXPORTA POR NÍVEL (Para as seções da Home) ===
export const seriesByLevel = {
  pillars: [
    ...Object.values(seriesNumbers),
    ...Object.values(seriesPeople),
    ...Object.values(seriesTime),
    ...Object.values(seriesWorld),
    ...Object.values(seriesActions),
  ],
  starter: [
    ...Object.values(seriesFirstDay),
    ...Object.values(seriesMysteryBox),
    ...Object.values(seriesPhotograph),
    ...Object.values(seriesFashionBoss),
    ...Object.values(seriesBadDate),
    ...Object.values(seriesGossipNeighbor),
    ...Object.values(seriesFakeLife),
    ...Object.values(seriesParisTrip),
  ],
  a1: [
    ...Object.values(seriesMidnightKey),
    ...Object.values(seriesWrongPhone),
    ...Object.values(seriesRedLipstick),
    ...Object.values(seriesDoctorsSecret),
  ],
  a2: [] // Futuro
}