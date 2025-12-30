// src/services/gamificationService.js
import { db } from './firebase'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import {
  BADGE_DEFINITIONS,
  checkSeriesCompletionBadge,
  checkDictationBadge,
  checkQuizBadge,
  checkStreakBadge,
  buildBadgeContext
} from '../utils/badgeSystem'

const TUTORIAL_SERIES_ID = 0

/**
 * gamificationService.js
 * Responsável por:
 * - Verificar e conceder badges
 * - Evitar duplicação de badges (race condition fix)
 * - Gerenciar fila de badges para exibição
 * 
 * v13: Adicionado suporte a checkStreakBadge
 */

export const gamificationService = {
  /**
   * Função genérica para verificar e conceder badges
   * Tipo pode ser: 'series' | 'dictation' | 'quiz' | 'streak'
   * 
   * Usando arrayUnion() em vez de read-then-write para evitar race conditions
   */
  async checkAndAwardBadge(uid, badgeType, context, currentBadges) {
    if (!uid || !badgeType || !context) return null

    // Seleciona a função verificadora correta
    let checkFunction
    switch (badgeType) {
      case 'series':
        checkFunction = checkSeriesCompletionBadge
        break
      case 'dictation':
        checkFunction = checkDictationBadge
        break
      case 'quiz':
        checkFunction = checkQuizBadge
        break
      case 'streak':
        checkFunction = checkStreakBadge
        break
      default:
        console.warn(`[gamificationService] Tipo de badge desconhecido: ${badgeType}`)
        return null
    }

    // Verifica se merece novo badge
    const newBadge = checkFunction(context, currentBadges)

    if (newBadge) {
      const userRef = doc(db, 'users', uid)
      
      // ✅ HOTFIX DE RACE CONDITION:
      // arrayUnion() adiciona à array de forma atômica
      // Evita que 2 requisições simultâneas dupliquem a badge
      try {
        await updateDoc(userRef, {
          badges: arrayUnion(newBadge)
        })
        
        console.log(`[gamificationService] Badge concedida: ${newBadge}`)
        return newBadge
      } catch (e) {
        console.error(`[gamificationService] Erro ao conceder badge:`, e)
        return null
      }
    }

    return null // Nenhum novo badge
  },

  /**
   * Verifica badge de conclusão de série
   */
  async checkSeriesBadge(uid, userData) {
    if (!userData) return null

    const context = buildBadgeContext(userData)
    const currentBadges = userData.badges || []

    return this.checkAndAwardBadge(uid, 'series', context, currentBadges)
  },

  /**
   * Verifica badge de ditado perfeito (100%)
   */
  async checkDictationBadge(uid, userData) {
    if (!userData) return null

    const context = buildBadgeContext(userData)
    const currentBadges = userData.badges || []

    return this.checkAndAwardBadge(uid, 'dictation', context, currentBadges)
  },

  /**
   * Verifica badge de quiz perfeito (100%)
   */
  async checkQuizBadge(uid, userData) {
    if (!userData) return null

    const context = buildBadgeContext(userData)
    const currentBadges = userData.badges || []

    return this.checkAndAwardBadge(uid, 'quiz', context, currentBadges)
  },

  /**
   * Verifica badge de streak (7 dias seguidos)
   * NOVO na v13
   */
  async checkStreakBadge(uid, userData) {
    if (!userData) return null

    const context = buildBadgeContext(userData)
    const currentBadges = userData.badges || []

    return this.checkAndAwardBadge(uid, 'streak', context, currentBadges)
  },

  /**
   * Retorna lista de badges conquistadas
   */
  async getUserBadges(uid) {
    if (!uid) return []

    const userRef = doc(db, 'users', uid)
    const snap = await getDoc(userRef)
    return snap.data()?.badges || []
  },

  /**
   * Retorna definições de TODAS as badges (para UI)
   */
  getBadgeDefinitions() {
    return BADGE_DEFINITIONS
  },

  /**
   * Helper: Calcula progresso de badges bloqueadas
   * Retorna { badgeId: { current, needed, percentage } }
   */
  calculateBadgeProgress(userData) {
    const progress = {}

    // Iterar sobre todas as badges e calcular progresso
    for (const [badgeId, badge] of Object.entries(BADGE_DEFINITIONS)) {
      if (!badge.requirement) continue

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
          continue
      }

      progress[badgeId] = {
        current: Math.min(current, count),
        needed: count,
        percentage: Math.min(100, Math.round((current / count) * 100))
      }
    }

    return progress
  }
}