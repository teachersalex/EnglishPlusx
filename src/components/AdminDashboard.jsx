import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { createStudentAccount } from '../services/adminService'
import Header from './Header'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Estados
  const [students, setStudents] = useState([]) 
  const [loading, setLoading] = useState(true) 
  const [showCreateModal, setShowCreateModal] = useState(false) 

  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [createLoading, setCreateLoading] = useState(false)

  // 🔒 LISTA VIP
  const ADMIN_EMAILS = [
    "alexmg@gmail.com", 
    "alexsbd85@gmail.com",
    "alexalienmg@gmail.com",
    "alexpotterbd@gmail.com"
  ]

  // Se não for Admin, chuta pra fora!
  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      navigate('/') 
    }
  }, [user, navigate])

  const fetchStudents = async () => {
    setLoading(true)
    const db = getFirestore()
    try {
      const q = query(collection(db, "users"), orderBy("lastActivity", "desc"))
      const querySnapshot = await getDocs(q)
      setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      fetchStudents()
    }
  }, [user])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      await createStudentAccount(formData.email, formData.password, formData.name)
      setShowCreateModal(false)
      setFormData({ name: '', email: '', password: '' })
      fetchStudents()
      alert('Aluno criado com sucesso!')
    } catch (error) {
      alert('Erro ao criar: ' + error.message)
    } finally {
      setCreateLoading(false)
    }
  }

  // --- 📅 FUNÇÃO MÁGICA PARA CORRIGIR AS DATAS ---
  const formatDate = (dateField) => {
    if (!dateField) return 'Nunca'
    
    // Se for Timestamp do Firebase (tem a função toDate)
    if (dateField?.toDate) {
      return dateField.toDate().toLocaleString('pt-BR')
    }
    
    // Se for Texto (formato antigo/Google)
    if (typeof dateField === 'string') {
      return new Date(dateField).toLocaleString('pt-BR')
    }
    
    return 'Data Inválida'
  }
  // -----------------------------------------------

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Portal do Professor</h1>
            <p className="text-[#6B7280]">Gestão de Alunos</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#333] transition-colors shadow-lg"
          >
            + Novo Aluno
          </button>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Aluno</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">XP / Nível</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Último Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-bold text-[#1A1A1A]">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-[#E50914] font-bold">{student.xp || 0} XP</span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {/* Usamos a função nova aqui 👇 */}
                    {formatDate(student.lastActivity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && !loading && <div className="p-8 text-center text-gray-500">Nenhum aluno.</div>}
        </div>
      </main>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Cadastrar Aluno</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input placeholder="Nome" required className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="Email" type="email" required className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input placeholder="Senha" type="text" required className="w-full bg-[#F0F0F0] p-4 rounded-xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button type="submit" disabled={createLoading} className="flex-1 py-3 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-[#333]">Criar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}