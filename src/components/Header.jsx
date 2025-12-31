import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from './LoginModal'
import { ADMIN_EMAILS } from '../constants'

export default function Header({ showBack, backTo }) {
  const navigate = useNavigate()
  const { user, userData, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  // Verifica se é Admin (seguro contra maiúsculas/minúsculas)
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  return (
    <>
      <header className="bg-[#1A1A1A] sticky top-0 z-50 border-b border-[#333]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          {showBack ? (
            <button 
              onClick={() => navigate(backTo || '/')}
              className="text-white hover:text-[#E50914] transition-colors font-medium flex items-center gap-1"
            >
              <span>←</span> Voltar
            </button>
          ) : (
            <div className="w-16" /> 
          )}
          
          {/* Logo + Early Access Tag */}
          <div 
            onClick={() => navigate('/')} 
            className="cursor-pointer flex flex-col items-center select-none"
          >
            <div className="flex items-center">
              <span className="font-bold text-white text-lg">Teacher Alex</span>
              <span className="font-bold text-[#E50914] text-lg ml-1">ENGLISH+</span>
            </div>
            {/* Early Access Tag */}
            <span className="text-[10px] text-amber-400/80 tracking-wider mt-0.5">
              Early Access Preview — Acesso Antecipado
            </span>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              
              {/* 👑 BOTÃO DO ADMIN (Só aparece pra você) */}
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-[#F59E0B] text-black px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 hover:bg-white transition-colors shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  title="Painel do Professor"
                >
                  <span>👑</span>
                  <span className="hidden sm:inline">ADMIN</span>
                </button>
              )}

              <div className="flex flex-col items-end">
                <span className="text-white text-sm font-medium leading-none">
                  {userData?.name?.split(' ')[0] || 'Aluno'}
                </span>
                <button 
                  onClick={logout}
                  className="text-[#6B7280] hover:text-[#E50914] transition-colors text-[10px] mt-0.5 uppercase tracking-wide"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <button 
              data-login
              onClick={() => setShowLogin(true)}
              className="bg-[#E50914] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#B20710] transition-colors shadow-lg"
            >
              ENTRAR
            </button>
          )}
        </div>
      </header>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}