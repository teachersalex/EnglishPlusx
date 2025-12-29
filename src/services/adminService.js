// src/services/adminService.js
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore'
import { firebaseConfig, db } from './firebase'

// Instância secundária APENAS para criar usuários sem deslogar o admin
const secondaryApp = initializeApp(firebaseConfig, "Secondary")
const secondaryAuth = getAuth(secondaryApp)
const secondaryDb = getFirestore(secondaryApp)

// IMPORTANTE:
// - secondaryDb → só para criar usuário novo (createStudentAccount)
// - db (importado) → para todas as outras operações (leitura, update, delete)

/**
 * Cria uma nova conta de aluno
 * Usa instância secundária para não deslogar o admin
 */
export async function createStudentAccount(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const user = userCredential.user

    // Usa secondaryDb aqui pois estamos na instância secundária
    await setDoc(doc(secondaryDb, "users", user.uid), {
      name: name,
      email: email,
      createdAt: serverTimestamp(),
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
      // Time tracking
      totalTimeSpent: 0,
      weeklyTimeSpent: 0,
      weeklyTimeStart: null,
      // Admin fields
      role: 'student',
      status: 'active', // active | suspended
      lastActivity: serverTimestamp()
    })

    await signOut(secondaryAuth)

    return { success: true, uid: user.uid }
  } catch (error) {
    console.error("Erro ao criar aluno:", error)
    throw error
  }
}

/**
 * Busca todos os alunos ordenados por último acesso
 */
export async function getAllStudents() {
  try {
    const q = query(
      collection(db, "users"), 
      orderBy("lastActivity", "desc")
    )
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Erro ao buscar alunos:", error)
    throw error
  }
}

/**
 * Busca detalhes completos de um aluno (incluindo progresso)
 */
export async function getStudentDetails(uid) {
  try {
    // Dados básicos do usuário
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      throw new Error("Usuário não encontrado")
    }
    
    const userData = { id: uid, ...userSnap.data() }
    
    // Progresso de todos os episódios
    const progressRef = collection(db, "users", uid, "progress")
    const progressSnap = await getDocs(progressRef)
    const progress = progressSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Transcrições (últimas 10)
    const transcriptionsRef = collection(db, "users", uid, "transcriptions")
    const transcriptionsSnap = await getDocs(query(transcriptionsRef, orderBy("savedAt", "desc")))
    const transcriptions = transcriptionsSnap.docs.slice(0, 10).map(d => ({ id: d.id, ...d.data() }))
    
    return {
      user: userData,
      progress,
      transcriptions,
      stats: {
        totalEpisodes: progress.length,
        completedEpisodes: progress.filter(p => p.completed).length,
        averageDictationScore: calculateAverage(progress, 'dictationBestScore'),
        lastActiveEpisode: progress.sort((a, b) => 
          new Date(b.lastAccess) - new Date(a.lastAccess)
        )[0] || null
      }
    }
  } catch (error) {
    console.error("Erro ao buscar detalhes do aluno:", error)
    throw error
  }
}

/**
 * Suspende um aluno (não pode mais logar)
 */
export async function suspendStudent(uid) {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, {
      status: 'suspended',
      suspendedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error("Erro ao suspender aluno:", error)
    throw error
  }
}

/**
 * Reativa um aluno suspenso
 */
export async function reactivateStudent(uid) {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, {
      status: 'active',
      suspendedAt: null
    })
    return { success: true }
  } catch (error) {
    console.error("Erro ao reativar aluno:", error)
    throw error
  }
}

/**
 * Remove um aluno completamente (usuário + progresso + transcrições)
 * ⚠️ AÇÃO IRREVERSÍVEL
 */
export async function deleteStudent(uid) {
  try {
    // 1. Deletar todas as transcrições
    const transcriptionsRef = collection(db, "users", uid, "transcriptions")
    const transcriptionsSnap = await getDocs(transcriptionsRef)
    for (const docSnap of transcriptionsSnap.docs) {
      await deleteDoc(doc(db, "users", uid, "transcriptions", docSnap.id))
    }
    
    // 2. Deletar todo o progresso
    const progressRef = collection(db, "users", uid, "progress")
    const progressSnap = await getDocs(progressRef)
    for (const docSnap of progressSnap.docs) {
      await deleteDoc(doc(db, "users", uid, "progress", docSnap.id))
    }
    
    // 3. Deletar o documento do usuário
    await deleteDoc(doc(db, "users", uid))
    
    // Nota: A conta no Firebase Auth continua existindo
    // Para deletar completamente, precisaria de Cloud Functions
    // Por enquanto, o usuário não terá dados no Firestore
    
    return { success: true }
  } catch (error) {
    console.error("Erro ao deletar aluno:", error)
    throw error
  }
}

/**
 * Retorna analytics gerais da turma
 */
export async function getAnalytics() {
  try {
    const students = await getAllStudents()
    
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Filtra só alunos (não admins)
    const realStudents = students.filter(s => s.role !== 'admin')
    
    // Contagens
    const active7Days = realStudents.filter(s => {
      const lastActivity = parseDate(s.lastActivity)
      return lastActivity && lastActivity >= sevenDaysAgo
    }).length
    
    const active30Days = realStudents.filter(s => {
      const lastActivity = parseDate(s.lastActivity)
      return lastActivity && lastActivity >= thirtyDaysAgo
    }).length
    
    const suspended = realStudents.filter(s => s.status === 'suspended').length
    
    const inactive = realStudents.filter(s => {
      const lastActivity = parseDate(s.lastActivity)
      return !lastActivity || lastActivity < sevenDaysAgo
    }).length
    
    // XP total da turma
    const totalXP = realStudents.reduce((acc, s) => acc + (s.xp || 0), 0)
    
    // Média de XP
    const avgXP = realStudents.length > 0 
      ? Math.round(totalXP / realStudents.length) 
      : 0
    
    // Séries mais completadas
    const seriesCompletionCount = {}
    realStudents.forEach(s => {
      (s.completedSeriesIds || []).forEach(id => {
        const numId = parseInt(id, 10)
        if (numId !== 0) { // Ignora tutorial
          seriesCompletionCount[numId] = (seriesCompletionCount[numId] || 0) + 1
        }
      })
    })
    
    const popularSeries = Object.entries(seriesCompletionCount)
      .map(([id, count]) => ({ id: parseInt(id), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return {
      totalStudents: realStudents.length,
      active7Days,
      active30Days,
      inactive,
      suspended,
      totalXP,
      avgXP,
      popularSeries
    }
  } catch (error) {
    console.error("Erro ao buscar analytics:", error)
    throw error
  }
}

// ============================================
// RANKING SEMANAL
// ============================================

const ADMIN_EMAILS = [
  "alexmg@gmail.com",
  "alexsbd85@gmail.com",
  "alexalienmg@gmail.com",
  "alexpotterbd@gmail.com"
]

/**
 * Atualiza ranking semanal (chamado manualmente pelo admin)
 * Salva em settings/weeklyRanking
 */
export async function updateWeeklyRanking() {
  try {
    const snapshot = await getDocs(collection(db, 'users'))
    
    const ranking = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => {
        // Exclui admins, suspensos e roles admin
        if (ADMIN_EMAILS.includes(u.email?.toLowerCase())) return false
        if (u.status === 'suspended') return false
        if (u.role === 'admin') return false
        return true
      })
      .map(u => ({
        id: u.id,
        name: u.name || 'Aluno',
        diamonds: u.seriesWithDiamond || 0,
        precision: u.perfectDictationCount > 0 
          ? Math.min(99, 85 + u.perfectDictationCount * 2) 
          : 0,
        weeklyTime: u.weeklyTimeSpent || 0
      }))
      .sort((a, b) => {
        // Ordena por: diamantes > precisão > tempo
        if (b.diamonds !== a.diamonds) return b.diamonds - a.diamonds
        if (b.precision !== a.precision) return b.precision - a.precision
        return b.weeklyTime - a.weeklyTime
      })
      .slice(0, 5)
    
    await setDoc(doc(db, 'settings', 'weeklyRanking'), {
      ranking,
      updatedAt: serverTimestamp()
    })
    
    return ranking
  } catch (error) {
    console.error("Erro ao atualizar ranking:", error)
    throw error
  }
}

/**
 * Busca ranking salvo
 */
export async function getWeeklyRanking() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'weeklyRanking'))
    return snap.exists() ? snap.data() : { ranking: [], updatedAt: null }
  } catch (error) {
    console.error("Erro ao buscar ranking:", error)
    return { ranking: [], updatedAt: null }
  }
}

// ============================================
// HELPERS
// ============================================

function parseDate(dateField) {
  if (!dateField) return null
  
  // Timestamp do Firebase
  if (dateField?.toDate) {
    return dateField.toDate()
  }
  
  // String ISO
  if (typeof dateField === 'string') {
    return new Date(dateField)
  }
  
  return null
}

function calculateAverage(items, field) {
  const validItems = items.filter(item => typeof item[field] === 'number')
  if (validItems.length === 0) return 0
  
  const sum = validItems.reduce((acc, item) => acc + item[field], 0)
  return Math.round(sum / validItems.length)
}

// Calcula dias desde última atividade
export function getDaysInactive(lastActivity) {
  const lastDate = parseDate(lastActivity)
  if (!lastDate) return 999 // Nunca acessou
  
  const now = new Date()
  const diffMs = now - lastDate
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// Formata data para exibição
export function formatDate(dateField) {
  const date = parseDate(dateField)
  if (!date) return 'Nunca'
  
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formata tempo relativo
export function formatRelativeTime(dateField) {
  const days = getDaysInactive(dateField)
  
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days} dias atrás`
  if (days < 30) return `${Math.floor(days / 7)} semana${days >= 14 ? 's' : ''} atrás`
  if (days < 365) return `${Math.floor(days / 30)} mês${days >= 60 ? 'es' : ''} atrás`
  return 'Mais de 1 ano'
}