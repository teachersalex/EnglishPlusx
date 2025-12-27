// src/services/diamondService.js
import { db } from './firebase'
import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  getDocs
} from 'firebase/firestore'

const TUTORIAL_SERIES_ID = 0
const DIAMOND_THRESHOLD = 95 // Precisa de 95% média

/**
 * diamondService.js
 * Responsável por:
 * - Calcular se uma série merece diamante (≥95% de média)
 * - Atualizar contador de diamantes do usuário
 * - Recuperar quais séries têm diamante
 * 
 * Um diamante é conquistado quando:
 * - Série está 100% completa (todos episódios completados)
 * - Média de score de ditado ≥ 95%
 * - Não é tutorial
 */

export const diamondService = {
  /**
   * Verifica se uma série completa merece diamante
   * Precisa de TODOS os episódios completos E média ≥ 95%
   */
  async checkSeriesDiamond(uid, seriesId, totalEpisodes) {
    const numericSeriesId = parseInt(seriesId, 10)
    
    // Tutorial nunca ganha diamante
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return false
    }

    try {
      // Busca progresso de TODOS os episódios da série
      const progressRef = collection(db, 'users', uid, 'progress')
      const allProgressSnap = await getDocs(progressRef)
      
      const seriesProgress = allProgressSnap.docs
        .map(d => d.data())
        .filter(p => parseInt(p.seriesId, 10) === numericSeriesId)

      // Verifica se TODOS os episódios foram completados
      const completedCount = seriesProgress.filter(p => p.completed === true).length
      if (completedCount < totalEpisodes) {
        return false // Série não está completa
      }

      // Calcula média de scores de ditado
      const totalScore = seriesProgress.reduce((acc, curr) => {
        return acc + (curr.dictationBestScore || 0)
      }, 0)
      
      const average = totalScore / totalEpisodes
      
      // Precisa de ≥95%
      return average >= DIAMOND_THRESHOLD
    } catch (e) {
      console.error('[diamondService] Erro ao verificar série diamante:', e)
      return false
    }
  },

  /**
   * Atualiza contador de diamantes e adiciona série à lista
   * Retorna true se foi um novo diamante conquistado
   */
  async updateDiamondCount(uid, seriesId, totalEpisodes) {
    if (!uid) return false
    
    const numericSeriesId = parseInt(seriesId, 10)
    
    // Tutorial não conta
    if (numericSeriesId === TUTORIAL_SERIES_ID) {
      return false
    }

    try {
      // Verifica se merece diamante
      const hasDiamond = await this.checkSeriesDiamond(uid, numericSeriesId, totalEpisodes)
      if (!hasDiamond) return false

      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.data() || {}
      
      // Converte para números para consistência
      const diamondSeriesIds = (userData.diamondSeriesIds || []).map(id => parseInt(id, 10))
      
      // Já tem esse diamante?
      if (diamondSeriesIds.includes(numericSeriesId)) {
        return false // Já conquistado antes
      }

      // Novo diamante!
      const newDiamondSeriesIds = [...diamondSeriesIds, numericSeriesId]
      const newCount = newDiamondSeriesIds.length

      await updateDoc(userRef, {
        diamondSeriesIds: newDiamondSeriesIds,
        seriesWithDiamond: newCount
      })

      return true // Novo diamante conquistado
    } catch (e) {
      console.error('[diamondService] Erro ao atualizar diamante:', e)
      return false
    }
  },

  /**
   * Retorna mapa de { seriesId: boolean } indicando quais têm diamante
   * Útil para renderizar ícone de diamante na série
   */
  async getDiamondSeries(uid, seriesData) {
    if (!uid) return {}

    const diamonds = {}

    try {
      for (const [seriesId, series] of Object.entries(seriesData)) {
        const numericId = parseInt(seriesId, 10)
        
        // Pula tutorial
        if (numericId === TUTORIAL_SERIES_ID) {
          diamonds[numericId] = false
          continue
        }

        const hasDiamond = await this.checkSeriesDiamond(
          uid, 
          numericId, 
          series.episodes.length
        )
        diamonds[numericId] = hasDiamond
      }
    } catch (e) {
      console.error('[diamondService] Erro ao buscar diamantes:', e)
    }

    return diamonds
  },

  /**
   * Helper: Recalcula TODOS os diamantes de um usuário
   * (Útil se houve correção de dados ou migração)
   */
  async recalculateAllDiamonds(uid, seriesData) {
    if (!uid) return null

    try {
      const userRef = doc(db, 'users', uid)
      const newDiamondIds = []

      for (const [seriesId, series] of Object.entries(seriesData)) {
        const numericId = parseInt(seriesId, 10)
        
        if (numericId === TUTORIAL_SERIES_ID) continue

        const hasDiamond = await this.checkSeriesDiamond(
          uid, 
          numericId, 
          series.episodes.length
        )
        
        if (hasDiamond) {
          newDiamondIds.push(numericId)
        }
      }

      await updateDoc(userRef, {
        diamondSeriesIds: newDiamondIds,
        seriesWithDiamond: newDiamondIds.length
      })

      return {
        diamondSeriesIds: newDiamondIds,
        seriesWithDiamond: newDiamondIds.length
      }
    } catch (e) {
      console.error('[diamondService] Erro ao recalcular diamantes:', e)
      return null
    }
  }
}