// src/contexts/UserDataContext.jsx
// userData, XP, streak, time tracking
// ============================================
// 🔧 v16 FIX: getUserData existe, checkXPBadge removido (não existe)

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { userService } from '../services/userService'
import { gamificationService } from '../services/gamificationService'

const UserDataContext = createContext()

export function useUserData() {
  return useContext(UserDataContext)
}

export function UserDataProvider({ children }) {
  const { user } = useAuth()
  
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Time tracking refs
  const sessionStartRef = useRef(null)
  const lastActivityRef = useRef(null)
  
  // 🔧 FIX: Ref para user atual (evita closure stale)
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  // ========== TIME TRACKING ==========

  // 🔧 FIX: Reseta ANTES de salvar para evitar duplicação
  const saveSessionTime = useCallback(async (uid) => {
    if (!sessionStartRef.current || !uid) return
    
    const now = Date.now()
    const elapsedMs = now - sessionStartRef.current
    const elapsedMinutes = Math.floor(elapsedMs / 60000)
    
    if (elapsedMinutes >= 1) {
      // Reseta ANTES para evitar duplicação em caso de erro
      const minutesToSave = elapsedMinutes
      sessionStartRef.current = now
      
      try {
        // 🔧 FIX: Usa Promise.allSettled para continuar mesmo se um falhar
        const results = await Promise.allSettled([
          userService.addTimeSpent(uid, minutesToSave),
          userService.addWeeklyTimeSpent(uid, minutesToSave)
        ])
        
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.error(`[TimeTracking] Falha ${i}:`, result.reason)
          }
        })
      } catch (e) {
        console.error('[TimeTracking] Erro inesperado:', e)
      }
    }
  }, [])

  // Salva tempo a cada 5 minutos (com detecção de atividade)
  useEffect(() => {
    // 🔧 FIX: Usa user?.uid como dep em vez de user inteiro
    const uid = user?.uid
    if (!uid) return
    
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }
    
    // 🔧 FIX: Adiciona { passive: true } para performance
    const options = { passive: true }
    window.addEventListener('click', updateActivity, options)
    window.addEventListener('keydown', updateActivity, options)
    window.addEventListener('scroll', updateActivity, options)
    window.addEventListener('touchstart', updateActivity, options)
    
    // Inicializa
    updateActivity()
    sessionStartRef.current = Date.now()
    
    const interval = setInterval(() => {
      // Só salva se houve atividade nos últimos 6 minutos
      const sixMinutesAgo = Date.now() - (6 * 60 * 1000)
      const wasActive = lastActivityRef.current && lastActivityRef.current > sixMinutesAgo
      
      if (wasActive) {
        saveSessionTime(uid)
      } else {
        // Usuário inativo — reseta para não acumular
        sessionStartRef.current = Date.now()
      }
    }, 5 * 60 * 1000)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('scroll', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
    }
  }, [user?.uid, saveSessionTime])

  // Salva tempo ao fechar aba
  useEffect(() => {
    const uid = user?.uid
    if (!uid) return
    
    const handleBeforeUnload = () => {
      // 🔧 FIX: Usa ref para garantir user atual
      const currentUid = userRef.current?.uid
      if (sessionStartRef.current && currentUid) {
        const elapsedMs = Date.now() - sessionStartRef.current
        const elapsedMinutes = Math.floor(elapsedMs / 60000)
        
        if (elapsedMinutes >= 1) {
          const data = {
            uid: currentUid,
            minutes: elapsedMinutes,
            timestamp: Date.now()
          }
          localStorage.setItem('pendingTimeSpent', JSON.stringify(data))
        }
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [user?.uid])

  // Recupera tempo pendente do localStorage
  useEffect(() => {
    const uid = user?.uid
    if (!uid) return
    
    const pending = localStorage.getItem('pendingTimeSpent')
    if (pending) {
      try {
        const data = JSON.parse(pending)
        
        // 🔧 FIX: Validação rigorosa dos dados
        if (
          typeof data === 'object' &&
          data.uid === uid &&
          typeof data.minutes === 'number' &&
          data.minutes > 0 &&
          data.minutes < 1440 &&  // Max 24 horas
          typeof data.timestamp === 'number' &&
          Date.now() - data.timestamp < 3600000  // < 1 hora
        ) {
          const minutes = Math.floor(data.minutes)
          userService.addTimeSpent(uid, minutes)
          userService.addWeeklyTimeSpent(uid, minutes)
        }
      } catch (e) {
        // Silently ignore
      } finally {
        localStorage.removeItem('pendingTimeSpent')
      }
    }
  }, [user?.uid])

  // ========== XP & STREAK ==========

  // 🔧 v16 FIX: Não existe checkXPBadge no sistema de badges
  // O sistema tem: diamond, precision, volume, quiz, streak badges
  // Não há badge de XP — retorna null (sem erro)
  const updateUserXP = useCallback(async (amount) => {
    const uid = user?.uid
    if (!uid || !amount || amount <= 0) return null
    
    try {
      await userService.addXP(uid, amount)
      setUserData(prev => ({ 
        ...prev, 
        xp: (prev?.xp || 0) + amount 
      }))
      
      // 🔧 v16: Não existe badge de XP no sistema
      // Badges são ganhos por: completar série, ditado perfeito, quiz perfeito, streak
      // O XP é só um número que acumula — não dispara badges
      return null
    } catch (e) {
      console.error('[UserData] Erro ao dar XP:', e)
      return null
    }
  }, [user?.uid])

  // 🔧 FIX: updateStreak com dados frescos (não usa userData stale)
  const updateStreak = useCallback(async () => {
    const uid = user?.uid
    if (!uid) return null

    try {
      const result = await userService.calculateAndUpdateStreak(uid)
      if (!result) return null
      
      // Atualiza state local
      setUserData(prev => ({
        ...prev,
        streak: result.streak,
        lastActivity: result.lastActivity
      }))

      // 🔧 v16 FIX: getUserData agora existe no userService
      const freshUserData = await userService.getUserData(uid)
      if (!freshUserData) return null
      
      const badge = await gamificationService.checkStreakBadge(uid, freshUserData)
      
      if (badge) {
        setUserData(prev => ({
          ...prev,
          badges: [...(prev?.badges || []), badge]
        }))
      }
      
      return badge
    } catch (e) {
      console.error('[UserData] Erro ao atualizar streak:', e)
      return null
    }
  }, [user?.uid])

  // ========== LOAD USER DATA ==========

  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        setUserData(null)
        setIsLoading(false)
        sessionStartRef.current = null
        lastActivityRef.current = null
        return
      }

      try {
        const data = await userService.createOrGetUser(
          user.uid, 
          user.email, 
          user.displayName
        )
        setUserData(data)
        
        // Inicia sessão
        sessionStartRef.current = Date.now()
        lastActivityRef.current = Date.now()
        
        // Atualiza streak no login
        await updateStreak()
      } catch (e) {
        console.error('[UserData] Erro ao carregar:', e)
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    loadUserData()
  }, [user, updateStreak])

  // Salva tempo antes de logout (chamado pelo AuthContext)
  const saveTimeBeforeLogout = useCallback(async () => {
    const uid = user?.uid
    if (uid) {
      await saveSessionTime(uid)
    }
    sessionStartRef.current = null
    lastActivityRef.current = null
  }, [user?.uid, saveSessionTime])

  // ========== CONTEXT VALUE ==========

  const value = {
    userData,
    isLoading,
    updateUserXP,
    updateStreak,
    saveTimeBeforeLogout,
    
    // Setters diretos para outros contexts atualizarem
    setUserData
  }

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}