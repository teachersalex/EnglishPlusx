// src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { seriesData } from '../data/series'
import Header from './Header'
import { CreateStudentModal, StudentDetailsModal, ConfirmModal } from './modals/AdminModals'
import {
  getAllStudents,
  suspendStudent,
  reactivateStudent,
  deleteStudent,
  getAnalytics,
  getDaysInactive,
  formatDate,
  formatRelativeTime,
  updateWeeklyRanking
} from '../services/adminService'

const ADMIN_EMAILS = [
  "alexmg@gmail.com",
  "alexsbd85@gmail.com",
  "alexalienmg@gmail.com",
  "alexpotterbd@gmail.com"
]

// Componentes inline pequenos
const StatCard = ({ icon, value, label, color = 'gray' }) => {
  const colors = {
    gray: 'from-gray-500 to-gray-600',
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
          <p className="text-[#6B7280] text-sm">{label}</p>
        </div>
      </div>
    </motion.div>
  )
}

const StatusBadge = ({ status, daysInactive }) => {
  if (status === 'suspended') return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">🚫 Suspenso</span>
  if (daysInactive > 30) return <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">💤 Inativo</span>
  if (daysInactive > 7) return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">⚠️ Sumiu</span>
  return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">✓ Ativo</span>
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [students, setStudents] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  
  // Estado para atualização do ranking
  const [updatingRanking, setUpdatingRanking] = useState(false)

  // Verifica admin
  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      navigate('/')
    }
  }, [user, navigate])

  // Carrega dados
  const loadData = async () => {
    setLoading(true)
    try {
      const [studentsData, analyticsData] = await Promise.all([
        getAllStudents(),
        getAnalytics()
      ])
      setStudents(studentsData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      loadData()
    }
  }, [user])

  // Filtra alunos
  const filteredStudents = students.filter(s => s.role !== 'admin').filter(s => {
    const days = getDaysInactive(s.lastActivity)
    if (filter === 'active') return s.status !== 'suspended' && days <= 7
    if (filter === 'inactive') return s.status !== 'suspended' && days > 7
    if (filter === 'suspended') return s.status === 'suspended'
    return true
  })

  // Ações
  const handleSuspend = async (student) => {
    student.status === 'suspended' ? await reactivateStudent(student.id) : await suspendStudent(student.id)
    loadData()
  }

  const handleDelete = async (student) => {
    await deleteStudent(student.id)
    loadData()
  }

  // Atualizar ranking
  const handleUpdateRanking = async () => {
    setUpdatingRanking(true)
    try {
      await updateWeeklyRanking()
      alert('🏆 Ranking atualizado com sucesso!')
    } catch (error) {
      alert('Erro ao atualizar ranking: ' + error.message)
    } finally {
      setUpdatingRanking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Título */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Portal do Professor</h1>
            <p className="text-[#6B7280]">Acompanhe seus alunos</p>
          </div>
          <div className="flex gap-3">
            {/* Botão Atualizar Ranking */}
            <button
              onClick={handleUpdateRanking}
              disabled={updatingRanking}
              className="bg-[#F59E0B] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#D97706] transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              🏆 {updatingRanking ? 'Atualizando...' : 'Atualizar Ranking'}
            </button>
            {/* Botão Novo Aluno */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#333] transition-colors shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">+</span> Novo Aluno
            </button>
          </div>
        </div>

        {/* Stats */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon="👥" value={analytics.totalStudents} label="Total de Alunos" color="blue" />
            <StatCard icon="✅" value={analytics.active7Days} label="Ativos (7 dias)" color="green" />
            <StatCard icon="💤" value={analytics.inactive} label="Inativos" color="yellow" />
            <StatCard icon="⭐" value={analytics.avgXP} label="XP Médio" color="gray" />
          </div>
        )}

        {/* Séries Populares */}
        {analytics?.popularSeries?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-lg mb-8">
            <h2 className="font-bold text-[#1A1A1A] mb-4">🔥 Séries Mais Populares</h2>
            <div className="flex gap-3 flex-wrap">
              {analytics.popularSeries.map(({ id, count }) => (
                <div key={id} className="px-4 py-2 bg-[#F0F0F0] rounded-xl flex items-center gap-2">
                  <span className="font-medium text-[#1A1A1A]">{seriesData[id]?.title || `Série ${id}`}</span>
                  <span className="text-xs bg-[#1A1A1A] text-white px-2 py-0.5 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'active', label: '✅ Ativos' },
            { key: 'inactive', label: '💤 Inativos' },
            { key: 'suspended', label: '🚫 Suspensos' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                filter === f.key ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#6B7280] hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F0F0F0] border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-[#6B7280] uppercase">Aluno</th>
                  <th className="p-4 text-xs font-bold text-[#6B7280] uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-[#6B7280] uppercase">XP</th>
                  <th className="p-4 text-xs font-bold text-[#6B7280] uppercase">Último Acesso</th>
                  <th className="p-4 text-xs font-bold text-[#6B7280] uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student) => {
                  const days = getDaysInactive(student.lastActivity)
                  return (
                    <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`hover:bg-gray-50 ${student.status === 'suspended' ? 'opacity-60' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#333] flex items-center justify-center text-white font-bold">
                            {student.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-[#1A1A1A]">{student.name}</p>
                            <p className="text-xs text-[#9CA3AF]">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><StatusBadge status={student.status} daysInactive={days} /></td>
                      <td className="p-4">
                        <span className="font-bold text-[#E50914]">{student.xp || 0}</span>
                        <span className="text-[#9CA3AF] text-sm"> XP</span>
                        {student.seriesWithDiamond > 0 && <span className="ml-2 text-sm">💎 {student.seriesWithDiamond}</span>}
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-[#1A1A1A]">{formatRelativeTime(student.lastActivity)}</p>
                        <p className="text-xs text-[#9CA3AF]">{formatDate(student.lastActivity)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setSelectedStudent(student); setShowDetailsModal(true) }} className="p-2 hover:bg-[#F0F0F0] rounded-lg" title="Ver">👁️</button>
                          <button
                            onClick={() => setConfirmAction({
                              student,
                              title: student.status === 'suspended' ? 'Reativar?' : 'Suspender?',
                              message: student.status === 'suspended' ? `${student.name} poderá acessar novamente.` : `${student.name} não conseguirá acessar.`,
                              confirmText: student.status === 'suspended' ? 'Reativar' : 'Suspender',
                              onConfirm: () => handleSuspend(student)
                            })}
                            className="p-2 hover:bg-[#F0F0F0] rounded-lg"
                            title={student.status === 'suspended' ? 'Reativar' : 'Suspender'}
                          >
                            {student.status === 'suspended' ? '✅' : '🚫'}
                          </button>
                          <button
                            onClick={() => setConfirmAction({
                              student,
                              title: 'Remover Aluno?',
                              message: `Apagar TODOS os dados de ${student.name}. Irreversível!`,
                              confirmText: 'Remover',
                              danger: true,
                              onConfirm: () => handleDelete(student)
                            })}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                            title="Remover"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredStudents.length === 0 && !loading && (
            <div className="p-12 text-center text-[#6B7280]">
              {filter === 'all' ? 'Nenhum aluno cadastrado.' : 'Nenhum aluno nesta categoria.'}
            </div>
          )}
          {loading && <div className="p-12 text-center text-[#6B7280]">Carregando...</div>}
        </motion.div>
      </main>

      {/* Modals */}
      <CreateStudentModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={loadData} />
      <StudentDetailsModal student={selectedStudent} isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedStudent(null) }} />
      <ConfirmModal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={confirmAction?.onConfirm} title={confirmAction?.title} message={confirmAction?.message} confirmText={confirmAction?.confirmText} danger={confirmAction?.danger} />
    </div>
  )
}