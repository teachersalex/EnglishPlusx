import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from './LoginModal'

export default function Header({ showBack, backTo }) {
  const navigate = useNavigate()
  const { user, userData, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
      <header className="bg-[#1A1A1A] sticky top-0 z-50 border-b border-[#333]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          {showBack ? (
            <button 
              onClick={() => navigate(backTo || '/')}
              className="text-white hover:text-[#E50914] transition-colors font-medium"
            >
              ← Voltar
            </button>
          ) : (
             <div className="w-10"></div>
          )}
          
          <div onClick={() => navigate('/')} className="cursor-pointer">
            <span className="font-bold text-white text-lg">Teacher Alex</span>
            <span className="font-bold text-[#E50914] text-lg ml-1">ENGLISH+</span>
          </div>
          
          {user ? (
            <div className="flex items-center gap-3">
              
              {/* BOTÃO FORÇADO - VAI APARECER PARA TODO MUNDO LOGADO */}
              <button
                onClick={() => navigate('/admin')}
                className="bg-yellow-500 text-black px-3 py-1 rounded font-bold text-xs hover:bg-white"
              >
                ADMIN
              </button>
              {/* --------------------------------------------------- */}

              <div className="flex flex-col items-end">
                <span className="text-white text-sm">{userData?.name?.split(' ')[0]}</span>
                <button onClick={logout} className="text-[#6B7280] text-xs hover:text-red-500">Sair</button>
              </div>
            </div>
          ) : (
            <button 
              data-login
              onClick={() => setShowLogin(true)}
              className="bg-[#E50914] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#B20710]"
            >
              Entrar
            </button>
          )}
        </div>
      </header>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}