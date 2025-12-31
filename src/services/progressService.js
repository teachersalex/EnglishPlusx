// src/services/progressService.js
import { db } from './firebase'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  increment 
} from 'firebase/firestore'
import { TUTORIAL_SERIES_ID } from '../constants'

/**
 * progressService.js
 * Responsável por:
 * - Salvar progresso de episódios
 * - Salvar scores de ditados e quizzes
 * - Recuperar progresso
 * - Atualizar contadores de conclusão
 * 
 * HOTFIXES APLICADOS:
 * 1. increment() com updateDoc, NÃO setDoc
 * 2. Mantém sincronismo entre salvamento e query
 * 3. Estrutura consistente com Firestore
 * 
 * v15: Precisão real no ranking
 * - totalDictationScore: soma de todos os scores (primeira tentativa)
 * - totalDictationCount: quantidade de ditados feitos
 * - Média = totalDictationScore / totalDictationCount
 */

export const progressService = {
  /**
   * Salva o progresso de um episódio
   * Usa setDoc + merge para criar ou atualizar
   */
  async saveEpisodeProgress(uid, seriesId, episodeId, data) {
    const numericSeriesId = parseInt(seriesId, 10)
    const numericEpisodeId = parseInt(episodeId, 10)
    
    const progressRef = doc(
      db, 
      'users', 
      uid, 
      'progress', 
      `${numericSeriesId}_${numericEpisodeId}`
    )
    
    const currentProgress = await getDoc(progressRef)
    const currentData = currentProgress.exists() ? currentProgress.data() : {}
    
    const payload = {
      seriesId: numericSeriesId,
      episodeId: numericEpisodeId,
      ...data,
      dictationBestScore: currentData.dictationBestScore || 0,
      lastAccess: new Date().toISOString()
    }

    await setDoc(progressRef, payload, { merge: true })
    return { 
      numericSeriesId, 
      numericEpisodeId, 
      isCompleted: data.completed 
    }
  },

  /**
   * Recupera o progresso de um episódio específico
   */
  async getProgress(uid, seriesId, episodeId) {
    const numericSeriesId = parseInt(seriesId, 10)
    const numericEpisodeId = parseInt(episodeId, 10)
    
    const progressRef = doc(
      db, 
      'users', 
      uid, 
      'progress', 
      `${numericSeriesId}_${numericEpisodeId}`
    )
    
    const snap = await getDoc(progressRef)
    return snap.exists() ? snap.data() : null
  },

  /**
   * Recupera TODOS os episódios completados de uma série
   */
  async getSeriesProgress(uid, seriesId) {
    const numericId = parseInt(seriesId, 10)
    const progressRef = collection(db, 'users', uid, 'progress')
    
    const snap = await getDocs(progressRef)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => parseInt(p.seriesId, 10) === numericId)
  },

  /**
   * Recupera o ÚLTIMO progresso (para "Continue de onde parou")
   * Se o último for tutorial (completado), pula e pega o anterior
   */
  async getLastProgress(uid) {
    const progressRef = collection(db, 'users', uid, 'progress')
    const q = query(progressRef, orderBy('lastAccess', 'desc'), limit(1))
    
    const snap = await getDocs(q)
    if (snap.empty) return null
    
    const data = snap.docs[0].data()

    // Lógica: Se último foi tutorial e completou, pega o anterior
    if (parseInt(data.seriesId, 10) === TUTORIAL_SERIES_ID && data.completed) {
      const q2 = query(progressRef, orderBy('lastAccess', 'desc'), limit(2))
      const snap2 = await getDocs(q2)
      if (snap2.docs.length > 1) {
        return snap2.docs[1].data()
      }
      return null
    }
    
    return data
  },

  /**
   * Salva o score de Ditado
   * 
   * Lógica:
   * 1. Se é a PRIMEIRA VEZ deste episódio (best === 0):
   *    - Adiciona score à soma total (para calcular média real)
   *    - Incrementa contador de ditados
   * 2. Se for melhor que anterior, atualiza o best score
   * 3. Se for 100% pela primeira vez, incrementa perfectDictationCount
   * 
   * ⚠️ IMPORTANTE: increment() só funciona com updateDoc(), não setDoc()
   */
  async saveDictationScore(uid, seriesId, episodeId, score) {
    const numericSeriesId = parseInt(seriesId, 10)
    const numericEpisodeId = parseInt(episodeId, 10)
    
    const progressRef = doc(
      db, 
      'users', 
      uid, 
      'progress', 
      `${numericSeriesId}_${numericEpisodeId}`
    )
    
    const snap = await getDoc(progressRef)
    const existingData = snap.exists() ? snap.data() : {}
    const best = existingData.dictationBestScore || 0
    const isFirstAttempt = best === 0
    
    // Atualiza score se for melhor
    if (score > best) {
      await setDoc(progressRef, { 
        seriesId: numericSeriesId,
        episodeId: numericEpisodeId,
        dictationBestScore: score,
        lastAccess: new Date().toISOString()
      }, { merge: true })
    }

    // Tutorial não conta para badges/contadores/média
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return false
    }

    const userRef = doc(db, 'users', uid)

    // PRIMEIRA TENTATIVA: adiciona à média real
    // Só conta a primeira vez para evitar farming de média
    if (isFirstAttempt) {
      await updateDoc(userRef, { 
        totalDictationScore: increment(score),
        totalDictationCount: increment(1)
      })
    }

    // Se é primeiro 100%, incrementa contador de perfeitos
    if (score === 100 && best < 100) {
      await updateDoc(userRef, { 
        perfectDictationCount: increment(1)
      })
      
      return true // Sinal de que ganhou novo perfect
    }
    
    return false
  },

  /**
   * HOTFIX #2: Salva o score de Quiz
   * Se for 100% (todas respostas corretas), incrementa perfectQuizCount
   * 
   * ⚠️ IMPORTANTE: usa updateDoc() com increment(), não setDoc()
   */
  async saveQuizScore(uid, seriesId, episodeId, score, totalQuestions) {
    const numericSeriesId = parseInt(seriesId, 10)
    
    // Tutorial não conta
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return false
    }
    
    const isPerfect = score === totalQuestions
    
    if (isPerfect) {
      const userRef = doc(db, 'users', uid)
      
      // ✅ HOTFIX: usar updateDoc com increment(), não setDoc
      await updateDoc(userRef, { 
        perfectQuizCount: increment(1)
      })
      
      return true // Sinal de que ganhou novo perfect
    }
    
    return false
  },

  /**
   * Atualiza contadores globais de conclusão
   * - totalEpisodesCompleted
   * - totalSeriesCompleted
   * 
   * Esta função escaneia TODA a collection de progress
   * (potencial para otimização com índices later)
   */
  async updateCompletionStats(uid, seriesId) {
    const numericSeriesId = parseInt(seriesId, 10)
    
    // Tutorial não incrementa contadores
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return null
    }

    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    const userData = userSnap.data() || {}
    
    // Conta todos os episódios completos
    const progressRef = collection(db, 'users', uid, 'progress')
    const progressSnap = await getDocs(progressRef)
    
    const completedEpisodes = progressSnap.docs.filter(d => {
      const dData = d.data()
      return (
        dData.completed === true && 
        parseInt(dData.seriesId, 10) !== TUTORIAL_SERIES_ID
      )
    }).length

    // Atualiza só se mudou
    if (completedEpisodes !== userData.totalEpisodesCompleted) {
      await updateDoc(userRef, { 
        totalEpisodesCompleted: completedEpisodes 
      })
      return { totalEpisodesCompleted: completedEpisodes }
    }
    
    return null
  },

  /**
   * Marca uma série como completa na lista completedSeriesIds
   * Incrementa totalSeriesCompleted (se não for tutorial)
   * 
   * NOTA: Esta lógica é separada de updateCompletionStats
   * porque precisa verificar o JSON de seriesData para saber
   * quantos episódios a série tem.
   */
  async markSeriesAsCompleted(uid, seriesId, seriesData) {
    const numericSeriesId = parseInt(seriesId, 10)
    
    // Tutorial não marca como série completa
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return null
    }

    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    const userData = userSnap.data() || {}
    
    const completedIds = (userData.completedSeriesIds || []).map(id => parseInt(id, 10))
    
    // Já está completa?
    if (completedIds.includes(numericSeriesId)) {
      return null
    }

    // Adiciona à lista
    const newCompletedIds = [...completedIds, numericSeriesId]
    
    await updateDoc(userRef, { 
      completedSeriesIds: newCompletedIds,
      totalSeriesCompleted: (userData.totalSeriesCompleted || 0) + 1
    })
    
    return {
      completedSeriesIds: newCompletedIds,
      totalSeriesCompleted: (userData.totalSeriesCompleted || 0) + 1
    }
  }
}