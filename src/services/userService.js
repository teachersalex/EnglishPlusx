// src/services/userService.js
import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'

/**
 * userService.js
 * Responsável por:
 * - Criar/recuperar documentos de usuário
 * - Atualizar XP
 * - Calcular e atualizar Streak
 * - Gerenciar Badges do usuário
 */

export const userService = {
  /**
   * Cria ou recupera dados do usuário no login
   * Se é primeira vez: cria documento com valores iniciais
   * Se já existe: retorna dados existentes
   */
  async createOrGetUser(uid, email, name) {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const newUserData = {
        email,
        name: name || email.split('@')[0],
        xp: 0,
        streak: 0,
        badges: [],
        totalEpisodesCompleted: 0,
        totalSeriesCompleted: 0,
        seriesWithDiamond: 0,
        perfectDictationCount: 0,
        perfectQuizCount: 0,
        completedSeriesIds: [],
        diamondSeriesIds: [],
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      await setDoc(userRef, newUserData)
      return newUserData
    }
    return userSnap.data()
  },

  /**
   * Adiciona XP ao usuário
   * Usa increment() para evitar race conditions
   */
  async addXP(uid, amount) {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { xp: increment(amount) })
    return amount
  },

  /**
   * Calcula e atualiza o Streak
   * Lógica:
   * - Se é primeira atividade: streak = 1
   * - Se foi ontem: streak += 1
   * - Se foi mais de 1 dia atrás: streak = 1 (reseta)
   * - Se foi hoje: sem mudança (já contado)
   */
  async calculateAndUpdateStreak(uid) {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    const data = userSnap.data()
    
    if (!data) return null

    const lastActivity = data.lastActivity ? new Date(data.lastActivity) : null
    const now = new Date()
    
    // Normaliza para meia-noite para comparação de dias
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastDay = lastActivity 
      ? new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
      : null
    
    const diffDays = lastDay 
      ? Math.floor((today - lastDay) / (1000 * 60 * 60 * 24))
      : null
    
    let newStreak = data.streak || 0
    let shouldUpdate = false
    
    if (diffDays === null || diffDays > 1) {
      // Primeira vez ou gap > 1 dia: começa do 1
      newStreak = 1
      shouldUpdate = true
    } else if (diffDays === 1) {
      // Ontem foi a última atividade: incrementa
      newStreak = (data.streak || 0) + 1
      shouldUpdate = true
    } else if (diffDays === 0 && newStreak === 0) {
      // Hoje, mas ainda não foi contado: conta como 1
      newStreak = 1
      shouldUpdate = true
    }
    
    if (shouldUpdate) {
      await updateDoc(userRef, { 
        streak: newStreak,
        lastActivity: now.toISOString()
      })
      return { streak: newStreak, lastActivity: now.toISOString() }
    }
    
    return null // Sem mudança
  },

  /**
   * Recupera badges atuais do usuário
   */
  async getUserBadges(uid) {
    const userRef = doc(db, 'users', uid)
    const snap = await getDoc(userRef)
    return snap.data()?.badges || []
  },

  /**
   * Atualiza lista de badges
   * IMPORTANTE: Esta função espera a lista COMPLETA de badges
   * (não incrementa, substitui)
   */
  async updateUserBadges(uid, newBadges) {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { badges: newBadges })
  }
}