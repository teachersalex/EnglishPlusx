// src/components/modals/AdminModals.jsx
// 🔧 FIX v16: student?.id em deps do useEffect (previne re-fetch desnecessário)

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { seriesData } from '../../data/series'
import {
  createStudentAccount,
  getStudentDetails,
  formatDate
} from '../../services/adminService'

// ============================================
// MODAL: CRIAR ALUNO
// ============================================
export function CreateStudentModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await createStudentAccount(formData.email, formData.password, formData.name)
      setFormData({ name: '', email: '', password: '' })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao criar aluno')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Novo Aluno</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Nome</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#E50914] transition-all"
              placeholder="Maria Silva"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#E50914] transition-all"
              placeholder="maria@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Senha</label>
            <input
              type="text"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#E50914] transition-all"
              placeholder="senha123"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">Você pode ver a senha para passar ao aluno</p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-[#6B7280] font-bold hover:bg-[#F0F0F0] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Aluno'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ============================================
// MODAL: DETALHES DO ALUNO
// ============================================
export function StudentDetailsModal({ student, isOpen, onClose }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 🔧 FIX: Usar student?.id ao invés de student inteiro
    // Objects são comparados por referência, então student sempre é "diferente"
    // Usar o ID primitivo evita re-fetches desnecessários
    if (isOpen && student?.id) {
      setLoading(true)
      getStudentDetails(student.id)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen, student?.id])  // 🔧 FIX: student?.id ao invés de student

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">{student?.name}</h2>
            <p className="text-[#6B7280]">{student?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#F0F0F0] flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#6B7280]">Carregando...</div>
        ) : details ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: details.user.xp || 0, label: 'XP Total', color: 'text-[#E50914]' },
                { value: details.user.streak || 0, label: 'Streak', color: 'text-[#1A1A1A]' },
                { value: details.stats.completedEpisodes, label: 'Episódios', color: 'text-[#1A1A1A]' },
                { value: `${details.stats.averageDictationScore}%`, label: 'Média Ditado', color: 'text-[#1A1A1A]' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#F0F0F0] rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-[#6B7280]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Badges */}
            {details.user.badges?.length > 0 && (
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Conquistas</h3>
                <div className="flex gap-2 flex-wrap">
                  {details.user.badges.map(badge => (
                    <span key={badge} className="px-3 py-1 bg-[#1A1A1A] text-white text-sm rounded-full">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Séries Completas */}
            {details.user.completedSeriesIds?.length > 0 && (
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">Séries Completas</h3>
                <div className="flex gap-2 flex-wrap">
                  {details.user.completedSeriesIds.map(id => {
                    const series = seriesData[id]
                    return series ? (
                      <span key={id} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">
                        ✓ {series.title}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* Progresso Recente */}
            <div>
              <h3 className="font-bold text-[#1A1A1A] mb-2">Progresso Recente</h3>
              <div className="bg-[#F0F0F0] rounded-xl p-4 max-h-48 overflow-y-auto">
                {details.progress.length > 0 ? (
                  <div className="space-y-2">
                    {details.progress
                      .sort((a, b) => new Date(b.lastAccess) - new Date(a.lastAccess))
                      .slice(0, 10)
                      .map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm">
                          <span className="text-[#1A1A1A]">
                            {seriesData[p.seriesId]?.title || `Série ${p.seriesId}`} - Ep {p.episodeId}
                          </span>
                          <div className="flex gap-2">
                            {p.completed && <span className="text-emerald-600">✓</span>}
                            {p.dictationBestScore > 0 && (
                              <span className="text-[#6B7280]">{p.dictationBestScore}%</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[#6B7280] text-sm">Nenhum progresso ainda</p>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="text-sm text-[#6B7280] pt-4 border-t border-[#F0F0F0]">
              <p>Criado em: {formatDate(details.user.createdAt)}</p>
              <p>Último acesso: {formatDate(details.user.lastActivity)}</p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-red-500">Erro ao carregar</div>
        )}
      </motion.div>
    </div>
  )
}

// ============================================
// MODAL: CONFIRMAÇÃO
// ============================================
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, danger = false }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')  // 🔧 FIX: Adiciona estado de erro

  const handleConfirm = async () => {
    setLoading(true)
    setError('')  // 🔧 FIX: Limpa erro anterior
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erro ao executar ação')  // 🔧 FIX: Mostra erro ao usuário
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">{title}</h2>
        <p className="text-[#6B7280] mb-4">{message}</p>
        
        {/* 🔧 FIX: Mostra erro ao usuário */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 text-[#6B7280] font-bold hover:bg-[#F0F0F0] rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-3 text-white font-bold rounded-xl transition-colors disabled:opacity-50 ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1A1A1A] hover:bg-[#333]'
            }`}
          >
            {loading ? '...' : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  )
}