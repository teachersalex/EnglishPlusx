// src/services/userService.js
import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from 'firebase/firestore'
import { ADMIN_EMAILS } from '../constants'

/**
 * userService.js
 * Responsável por:
 * - Criar/recuperar documentos de usuário
 * - Atualizar XP
 * - Calcular e atualizar Streak
 * - Gerenciar Badges do usuário
 * - Buscar Ranking Semanal
 * 
 * v15: Campos para precisão real
 * v16: Adicionado getUserData (fix bug)
 */

export const userService = {
  /**
   * Cria ou recupera dados do usuário no login
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
        // v15: Campos para precisão real no ranking
        totalDictationScore: 0,
        totalDictationCount: 0,
        // Time tracking
        totalTimeSpent: 0,
        weeklyTimeSpent: 0,
        weeklyTimeStart: null,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      await setDoc(userRef, newUserData)
      return newUserData
    }
    return userSnap.data()
  },

  /**
   * 🔧 v16 FIX: Busca dados atuais do usuário (sem criar)
   * Usado pelo updateStreak para pegar dados frescos
   */
  async getUserData(uid) {
    if (!uid) return null
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    return userSnap.exists() ? userSnap.data() : null
  },

  /**
   * Adiciona XP ao usuário
   */
  async addXP(uid, amount) {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { xp: increment(amount) })
    return amount
  },

  /**
   * Calcula e atualiza o Streak
   */
  async calculateAndUpdateStreak(uid) {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    const data = userSnap.data()
    
    if (!data) return null

    const lastActivity = data.lastActivity ? new Date(data.lastActivity) : null
    const now = new Date()
    
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
      newStreak = 1
      shouldUpdate = true
    } else if (diffDays === 1) {
      newStreak = (data.streak || 0) + 1
      shouldUpdate = true
    } else if (diffDays === 0 && newStreak === 0) {
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
    
    return null
  },

  async getUserBadges(uid) {
    const userRef = doc(db, 'users', uid)
    const snap = await getDoc(userRef)
    return snap.data()?.badges || []
  },

  async updateUserBadges(uid, newBadges) {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { badges: newBadges })
  },

  async addTimeSpent(uid, minutes) {
    if (!uid || minutes <= 0) return
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { 
      totalTimeSpent: increment(minutes)
    })
  },

  async addWeeklyTimeSpent(uid, minutes) {
    if (!uid || minutes <= 0) return
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    const data = userSnap.data() || {}
    
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset)
    const weekStart = monday.toISOString().split('T')[0]
    
    if (data.weeklyTimeStart !== weekStart) {
      await updateDoc(userRef, {
        weeklyTimeSpent: minutes,
        weeklyTimeStart: weekStart
      })
    } else {
      await updateDoc(userRef, {
        weeklyTimeSpent: increment(minutes)
      })
    }
  },

  /**
   * Busca ranking semanal (exclui admins)
   * v15: Precisão REAL (média dos ditados)
   */
  async getWeeklyRanking(excludeUid = null) {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    const users = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => {
        if (ADMIN_EMAILS.includes(u.email?.toLowerCase())) return false
        if (excludeUid && u.id === excludeUid) return false
        if (u.status === 'suspended') return false
        return true
      })
      .map(u => ({
        id: u.id,
        name: u.name || 'Aluno',
        diamonds: u.seriesWithDiamond || 0,
        precision: u.totalDictationCount > 0 
          ? Math.round(u.totalDictationScore / u.totalDictationCount) 
          : 0,
        weeklyTime: u.weeklyTimeSpent || 0
      }))
      .sort((a, b) => {
        if (b.diamonds !== a.diamonds) return b.diamonds - a.diamonds
        if (b.precision !== a.precision) return b.precision - a.precision
        return b.weeklyTime - a.weeklyTime
      })
      .slice(0, 5)
    
    return users
  }
}