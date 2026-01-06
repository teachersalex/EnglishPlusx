// src/components/DictationInput.jsx
// Área de digitação estilo Moleskine - THE GOLD
// v10.9 — Mudo persistente (localStorage)
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { typingSound } from './TypingSoundEngine'

export default function DictationInput({ 
  userText, 
  setUserText, 
  onCheck,
  disabled = false 
}) {
  const textareaRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  
  // [v10.9] Estado inicial lê preferência salva
  const [typingSoundEnabled, setTypingSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('englishplus_sound_muted')
    return saved === null ? true : saved === 'false'
  })
  
  const typingTimeoutRef = useRef(null)

  // Contador de palavras
  const wordCount = userText.trim() ? userText.trim().split(/\s+/).length : 0

  // Inicializa o engine de som no primeiro interaction
  useEffect(() => {
    const initSound = async () => {
      await typingSound.init()
      // [v10.9] Sincroniza engine com preferência salva
      const savedMuted = localStorage.getItem('englishplus_sound_muted') === 'true'
      if (savedMuted && typingSound.isEnabled?.()) {
        typingSound.toggle()
      }
      document.removeEventListener('click', initSound)
      document.removeEventListener('keydown', initSound)
    }
    document.addEventListener('click', initSound, { once: true })
    document.addEventListener('keydown', initSound, { once: true })
    return () => {
      document.removeEventListener('click', initSound)
      document.removeEventListener('keydown', initSound)
    }
  }, [])

  // Auto-focus na textarea
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [disabled])

  // Monitora digitação para som
  const handleTextChange = useCallback((e) => {
    const newText = e.target.value
    const isAddingChar = newText.length > userText.length
    setUserText(newText)
    
    // Som de digitação (só quando adiciona caractere)
    if (isAddingChar && typingSoundEnabled) {
      typingSound.play()
    }
    
    // Estado de "digitando" para animação
    setIsTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 150)
  }, [userText, typingSoundEnabled, setUserText])

  // [v10.9] Toggle som de digitação + salva preferência
  const toggleTypingSound = () => {
    const newState = typingSound.toggle()
    setTypingSoundEnabled(newState)
    localStorage.setItem('englishplus_sound_muted', String(!newState))
  }

  return (
    <div className="relative">
      {/* Borda Moleskine */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#3D3529] via-[#2A2318] to-[#1A1510] p-[3px]">
        <div className="w-full h-full rounded-[13px] bg-[#FAF8F5]" />
      </div>
      
      <motion.div 
        className="relative rounded-2xl overflow-hidden"
        animate={isFocused ? { 
          boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.5), 0 8px 32px rgba(0,0,0,0.12)' 
        } : {
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}
      >
        {/* Barra lateral estilo Moleskine - muda com foco */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-20 transition-all duration-300 ${
          isFocused 
            ? 'bg-gradient-to-b from-[#F59E0B] via-[#F59E0B] to-[#D97706] shadow-[2px_0_8px_rgba(245,158,11,0.3)]' 
            : 'bg-gradient-to-b from-[#E5E0D8] to-[#D4CFC5]'
        }`} />

        {/* Header minimalista */}
        <div className="bg-[#FAF8F5] px-5 pt-4 pb-2 flex items-center justify-between border-b border-[#E8E2D9]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#E50914]" />
            <span className="text-[#8B7E6A] text-xs font-medium uppercase tracking-wider">
              Transcrição
            </span>
          </div>
          
          {/* Som toggle */}
          <button
            onClick={toggleTypingSound}
            className={`p-1.5 rounded-lg transition-colors ${
              typingSoundEnabled 
                ? 'text-[#3D3529] hover:bg-[#E8E2D9]' 
                : 'text-[#C4B8A5] hover:bg-[#E8E2D9]'
            }`}
            title={typingSoundEnabled ? 'Som ligado' : 'Som desligado'}
          >
            {typingSoundEnabled ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Área de texto */}
        <div className="bg-[#FAF8F5] relative">
          {/* Linhas decorativas */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-full border-b border-[#E8E2D9]/50"
                style={{ top: `${28 + i * 28}px` }}
              />
            ))}
            {/* Margem lateral */}
            <div className="absolute left-12 top-0 bottom-0 w-px bg-[#E8C4C4]/30" />
          </div>
          
          <textarea
            ref={textareaRef}
            value={userText}
            onChange={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ouça o áudio e escreva o que você entende..."
            className="w-full min-h-[280px] p-5 pl-16 bg-transparent text-[#3D3529] text-lg leading-7 resize-none focus:outline-none placeholder:text-[#C4B8A5] placeholder:italic relative z-10"
            style={{ 
              fontFamily: "'Charter', 'Georgia', serif",
              lineHeight: '28px'
            }}
            spellCheck={false}
            disabled={disabled}
          />
          
          {/* Indicador de digitação ativa - pontinho piscando */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-4 right-4 w-2 h-2 bg-[#F59E0B] rounded-full z-20"
              />
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer com contador e botões */}
        <div className="bg-[#F5F2ED] px-5 py-3 flex items-center justify-between border-t border-[#E8E2D9]">
          {/* Contador de palavras */}
          <span className={`text-sm font-medium transition-colors ${
            wordCount > 0 ? 'text-[#3D3529]' : 'text-[#C4B8A5]'
          }`}>
            {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
          </span>
          
          <div className="flex gap-2">
            {/* Limpar */}
            {userText.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUserText('')}
                className="px-4 py-2 text-[#8B7E6A] text-sm font-medium hover:text-[#3D3529] transition-colors"
              >
                Limpar
              </motion.button>
            )}
            
            {/* Verificar */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCheck}
              disabled={!userText.trim()}
              className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all ${
                userText.trim() 
                  ? 'bg-[#3D3529] text-white hover:bg-[#2A2318] shadow-md' 
                  : 'bg-[#E8E2D9] text-[#C4B8A5] cursor-not-allowed'
              }`}
            >
              Verificar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}