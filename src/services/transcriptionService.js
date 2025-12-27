// src/services/transcriptionService.js
import { db } from './firebase'
import { 
  doc, 
  setDoc,
  collection, 
  query, 
  orderBy, 
  getDocs 
} from 'firebase/firestore'

/**
 * transcriptionService.js
 * Responsável por:
 * - Salvar transcrições de ditados
 * - Recuperar histórico de transcrições
 * 
 * HOTFIX APLICADO:
 * - Bug #1: orderBy('timestamp') vs 'savedAt'
 *   O código anterior tentava ordenar por 'timestamp' 
 *   mas saveTranscription salva como 'savedAt'.
 *   Resultado: Query falhava silenciosamente, retornava []
 */

export const transcriptionService = {
  /**
   * Salva uma transcrição de ditado
   * Estrutura:
   * - docId: ${seriesId}_${episodeId}_${timestamp}
   * - campos: seriesId, episodeId, text, savedAt
   */
  async saveTranscription(uid, data) {
    if (!uid || !data) return

    const docId = `${data.seriesId}_${data.episodeId}_${Date.now()}`
    const transcriptionRef = doc(
      db, 
      'users', 
      uid, 
      'transcriptions', 
      docId
    )

    await setDoc(transcriptionRef, { 
      ...data, 
      savedAt: new Date().toISOString() 
    })
  },

  /**
   * Recupera todas as transcrições de um episódio específico
   * Ordena por savedAt (descendente = mais recente primeiro)
   * 
   * ✅ HOTFIX: Estava orderBy('timestamp', 'desc')
   *           Mudou para orderBy('savedAt', 'desc')
   *           Agora funciona porque saveTranscription usa 'savedAt'
   */
  async getTranscriptions(uid, seriesId, episodeId) {
    if (!uid) return []

    const transcriptionsRef = collection(db, 'users', uid, 'transcriptions')
    
    // ✅ HOTFIX: orderBy('savedAt') em vez de 'timestamp'
    const q = query(transcriptionsRef, orderBy('savedAt', 'desc'))
    
    const snap = await getDocs(q)
    
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => {
        // Garante tipo correto antes de comparar
        const tSeriesId = parseInt(t.seriesId, 10)
        const tEpisodeId = parseInt(t.episodeId, 10)
        
        return (
          tSeriesId === parseInt(seriesId, 10) && 
          tEpisodeId === parseInt(episodeId, 10)
        )
      })
  },

  /**
   * Recupera TODAS as transcrições de um usuário
   * (Útil para admin dashboard ou analytics)
   */
  async getAllTranscriptions(uid) {
    if (!uid) return []

    const transcriptionsRef = collection(db, 'users', uid, 'transcriptions')
    const q = query(transcriptionsRef, orderBy('savedAt', 'desc'))
    
    const snap = await getDocs(q)
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  /**
   * Recupera transcrições de uma série específica
   */
  async getSeriesTranscriptions(uid, seriesId) {
    if (!uid) return []

    const transcriptionsRef = collection(db, 'users', uid, 'transcriptions')
    const q = query(transcriptionsRef, orderBy('savedAt', 'desc'))
    
    const snap = await getDocs(q)
    const numericSeriesId = parseInt(seriesId, 10)
    
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => parseInt(t.seriesId, 10) === numericSeriesId)
  }
}