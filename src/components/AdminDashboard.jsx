import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { createStudentAccount } from '../services/adminService'
import Header from './Header'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Segurança simples (Frontend-only por enquanto)
  // Substitua pelo SEU email real de admin
  const ADMIN_EMAIL = "seu_email_admin@gmail.com" 

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      navigate('/') // Chuta quem não for admin
    }
  }, [user, navigate])

  // Carregar lista de alunos
  const fetchStudents = async () => {
    setLoading(true)
    const db = getFirestore()
    try {
      // Pega todos os users ordenados por último acesso
      const q = query(collection(db, "users"), orderBy("lastActivity", "desc"))
      const querySnapshot = await getDocs(q)
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setStudents(list)
    } catch (error) {
      console.error("Erro ao buscar alunos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchStudents()
    }
  }, [user])

  // Formata data amigável (ex: "há 2 horas")
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Nunca'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diff = new Date() - date
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 5) return <span className="text-emerald-500 font-bold">Online agora</span>
    if (minutes < 60) return `${minutes} min atrás`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h atrás`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Control Tower</h1>
            <p className="text-[#6B7280]">Gestão de alunos e performance</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#333] transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Novo Aluno
          </button>
        </div>

        {/* STATS RÁPIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium uppercase">Total de Alunos</p>
            <p className="text-4xl font-bold text-[#1A1A1A] mt-2">{students.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium uppercase">Online (24h)</p>
            <p className="text-4xl font-bold text-[#E50914] mt-2">
              {students.filter(s => {
                 if(!s.lastActivity) return false
                 const date = s.lastActivity.toDate ? s.lastActivity.toDate() : new Date(s.lastActivity)
                 return (new Date() - date) < 86400000 // 24h em ms
              }).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium uppercase">XP Total da Turma</p>
            <p className="text-4xl font-bold text-[#F59E0B] mt-2">
              {(students.reduce((acc, curr) => acc + (curr.xp || 0), 0) / 1000).toFixed(1)}k
            </p>
          </div>
        </div>

        {/* TABELA DE ALUNOS */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aluno</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nível / XP</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Streak</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Último Acesso</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
                          {student.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A1A1A]">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Lv. {Math.floor((student.xp || 0) / 100) + 1}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">{student.xp || 0} XP</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-[#F59E0B] font-bold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.996-.067c.01.196.064.63.176 1.05.132.493.385 1.05.808 1.554.767.913 2.01 1.258 2.96 1.192l.003.001a4.996 4.996 0 01-1.213 2.664c-.305.305-.664.557-1.042.748a1 1 0 10.894 1.789c.593-.296 1.12-.663 1.565-1.082a6.996 6.996 0 002.046-5.115 11.296 11.296 0 011.085-3.32c.238-.475.437-.93.585-1.32.144-.38.232-.693.26-.884.026-.182-.03-.352-.108-.48a1 1 0 00-.565-.436z" clipRule="evenodd" /></svg>
                        {student.streak || 0}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatLastSeen(student.lastActivity)}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-[#1A1A1A]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL DE CRIAÇÃO */}
      <CreateStudentModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={fetchStudents}
      />
    </div>
  )
}

function CreateStudentModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await createStudentAccount(formData.email, formData.password, formData.name)
      onSuccess()
      onClose()
      setFormData({ name: '', email: '', password: '' }) // Reset
      alert(`Aluno ${formData.name} criado com sucesso!`)
    } catch (err) {
      setError("Erro ao criar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Cadastrar Novo Aluno</h2>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
            <input 
              required
              type="text" 
              className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Login)</label>
            <input 
              required
              type="email" 
              className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha Provisória</label>
            <input 
              required
              type="text" 
              className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-[#333] transition-colors flex justify-center"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Criar Aluno'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}