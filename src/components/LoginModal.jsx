// src/components/LoginModal.jsx
// 🔧 FIX v16: Usar finally ao invés de duplicar setLoading(false)

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function LoginModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, signup, loginWithGoogle } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await signup(email, password, name)
      }
      onClose()
    } catch (err) {
      setError(isLogin ? 'Email ou senha incorretos' : 'Erro ao criar conta')
    } finally {
      // 🔧 FIX: finally garante que setLoading(false) sempre executa
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      onClose()
    } catch (err) {
      setError('Erro ao entrar com Google')
    } finally {
      // 🔧 FIX: finally garante que setLoading(false) sempre executa
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">
          {isLogin ? 'Entrar' : 'Criar conta'}
        </h2>

        {error && (
          <p className="bg-[#EF4444]/10 text-[#EF4444] p-3 rounded-lg mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#F0F0F0] text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#E50914]"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 rounded-xl bg-[#F0F0F0] text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#E50914]"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-4 rounded-xl bg-[#F0F0F0] text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#E50914]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E50914] text-white py-4 rounded-xl font-bold hover:bg-[#B20710] transition-colors disabled:opacity-50"
          >
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-[#E5E5E5]" />
          <span className="text-[#6B7280] text-sm">ou</span>
          <div className="flex-1 h-px bg-[#E5E5E5]" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-white border-2 border-[#E5E5E5] text-[#1A1A1A] py-4 rounded-xl font-bold hover:bg-[#F0F0F0] transition-colors disabled:opacity-50"
        >
          Continuar com Google
        </button>

        <p className="text-center mt-6 text-[#6B7280]">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#E50914] font-bold ml-2"
          >
            {isLogin ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </motion.div>
    </motion.div>
  )
}