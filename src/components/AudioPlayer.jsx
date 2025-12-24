import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateDiff } from '../utils/dictationDiff'
import { useAuth } from '../contexts/AuthContext'
import BadgeCelebrationModal from './modals/BadgeCelebrationModal'

// ============================================
// TYPING SOUND ENGINE (Real Audio File)
// Som de teclado real com variação natural
// ============================================
class TypingSoundEngine {
  constructor() {
    this.audioContext = null
    this.audioBuffer = null
    this.enabled = true
    this.isLoading = false
  }

  async init() {
    if (this.audioContext) return
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Carrega o arquivo de som uma vez
    if (!this.audioBuffer && !this.isLoading) {
      this.isLoading = true
      try {
        const response = await fetch('/audio/keySound.mp3')
        const arrayBuffer = await response.arrayBuffer()
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      } catch (err) {
        console.warn('Não foi possível carregar som de teclado:', err)
      }
      this.isLoading = false
    }
  }

  play() {
    if (!this.enabled || !this.audioContext || !this.audioBuffer) return
    
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    // Cria source node
    const source = this.audioContext.createBufferSource()
    source.buffer = this.audioBuffer
    
    // Variação de pitch (0.9 a 1.1) — cada tecla soa diferente
    source.playbackRate.value = 0.9 + Math.random() * 0.2
    
    // Gain node para volume
    const gainNode = this.audioContext.createGain()
    // Variação de volume (0.3 a 0.5) — sutil mas presente
    gainNode.gain.value = 0.3 + Math.random() * 0.2
    
    // Conecta
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    // Toca apenas os primeiros 100ms do arquivo
    source.start(0, 0, 0.1)
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }

  setEnabled(value) {
    this.enabled = value
  }
}

const typingSound = new TypingSoundEngine()

// ============================================
// AUDIO PLAYER COMPONENT
// ============================================
export default function AudioPlayer({ 
  audioUrl, 
  coverImage, 
  episodeTitle, 
  initialTime, 
  onTimeUpdate, 
  transcript, 
  showQuiz, 
  setShowQuiz,
  seriesId,
  episodeId 
}) {
  const audioRef = useRef(null)
  const textareaRef = useRef(null)
  const { user, saveTranscription, saveDictationScore, updateUserXP, updateStreak, getProgress } = useAuth()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  const [showDictation, setShowDictation] = useState(false)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingSoundEnabled, setTypingSoundEnabled] = useState(true)
  const [attemptCount, setAttemptCount] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [previousBest, setPreviousBest] = useState(0)
  
  // [v2] Badge singular agora (string ou null)
  const [celebratingBadge, setCelebratingBadge] = useState(null)
  // [v2] Fila de badges pendentes (para mostrar um por vez)
  const [pendingBadges, setPendingBadges] = useState([])
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5]
  const typingTimeoutRef = useRef(null)

  // Contador de palavras
  const wordCount = userText.trim() ? userText.trim().split(/\s+/).length : 0

  // Inicializa o engine de som no primeiro interaction
  useEffect(() => {
    const initSound = async () => {
      await typingSound.init()
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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleLoaded = () => {
      setDuration(audio.duration)
      if (initialTime && initialTime > 0) audio.currentTime = initialTime
    }
    audio.addEventListener('loadedmetadata', handleLoaded)
    return () => audio.removeEventListener('loadedmetadata', handleLoaded)
  }, [initialTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime)
    
    const handleEnded = () => {
      setIsPlaying(false)
      if (onTimeUpdate) onTimeUpdate(audio.currentTime)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onTimeUpdate])

  useEffect(() => {
    if (!onTimeUpdate) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        onTimeUpdate(audioRef.current.currentTime)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [onTimeUpdate])

  // Auto-focus na textarea quando abre o ditado
  useEffect(() => {
    if (showDictation && textareaRef.current && !feedback) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [showDictation, feedback])

  // [v2] Processa fila de badges pendentes
  useEffect(() => {
    if (!celebratingBadge && pendingBadges.length > 0) {
      const [next, ...rest] = pendingBadges
      setCelebratingBadge(next)
      setPendingBadges(rest)
    }
  }, [celebratingBadge, pendingBadges])

  const handlePause = () => {
    if (onTimeUpdate && audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime)
    }
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (isPlaying) {
      audio.pause()
      handlePause()
    } else {
      try {
        await audio.play()
      } catch (err) {
        console.error('Erro ao tocar áudio:', err)
      }
    }
    setIsPlaying(!isPlaying)
  }

  const changeSpeed = (speed) => {
    setPlaybackRate(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skip = (seconds) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration))
    }
  }

  // Abre/fecha a área do Quiz a partir do Player
  const handleOpenQuiz = () => {
    setShowQuiz(true)
    setShowDictation(false)
  }

  // Abre/fecha a área de Ditado a partir do Player
  const handleOpenDictation = () => {
    setShowDictation(true)
    setShowQuiz(false)
  }

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
  }, [userText, typingSoundEnabled])

  // Toggle som de digitação
  const toggleTypingSound = () => {
    const newState = typingSound.toggle()
    setTypingSoundEnabled(newState)
  }

  // Verificar transcrição + Auto-save + XP
  const handleCheck = async () => {
    if (!userText.trim() || !transcript) return
    
    const result = calculateDiff(transcript, userText, episodeTitle)
    setFeedback(result)
    
    const newAttemptCount = attemptCount + 1
    setAttemptCount(newAttemptCount)
    
    // Calcula XP baseado no score
    let xp = 1 // <70% = 1 XP (incentivo)
    if (result.score >= 90) xp = 20
    else if (result.score >= 70) xp = 10
    
    setXpEarned(xp)
    
    // Verifica se é novo recorde
    let prevBest = 0
    if (user && getProgress && seriesId && episodeId) {
      try {
        const progress = await getProgress(seriesId, episodeId)
        prevBest = progress?.dictationBestScore || 0
        setPreviousBest(prevBest)
        setIsNewRecord(result.score > prevBest)
      } catch (err) {
        console.error("Erro ao buscar recorde:", err)
      }
    }
    
    // [v2] Coleta badges - agora cada função retorna string ou null
    const collectedBadges = []
    
    // Atualiza streak diário
    if (user && updateStreak) {
      try {
        const badge = await updateStreak()
        if (badge) collectedBadges.push(badge)
      } catch (err) {
        console.error("Erro ao atualizar streak:", err)
      }
    }
    
    // Dá XP pro usuário
    if (user && updateUserXP) {
      try {
        const badge = await updateUserXP(xp)
        if (badge) collectedBadges.push(badge)
      } catch (err) {
        console.error("Erro ao dar XP:", err)
      }
    }
    
    // Salva melhor score do ditado para gamificação
    if (user && saveDictationScore && seriesId && episodeId) {
      try {
        const badge = await saveDictationScore(seriesId, episodeId, result.score)
        if (badge) collectedBadges.push(badge)
      } catch (err) {
        console.error("Erro ao salvar dictation score:", err)
      }
    }
    
    // [v2] Remove duplicatas e dispara celebração UM POR VEZ
    const uniqueBadges = [...new Set(collectedBadges)]
    if (uniqueBadges.length > 0) {
      // Primeiro badge celebra agora, resto vai pra fila
      const [first, ...rest] = uniqueBadges
      setCelebratingBadge(first)
      if (rest.length > 0) {
        setPendingBadges(rest)
      }
    }
    
    // AUTO-SAVE da transcrição
    if (user && saveTranscription) {
      try {
        await saveTranscription({
          seriesId,
          episodeId,
          episodeTitle,
          userText: userText.trim(),
          score: result.score,
          correctCount: result.correctCount,
          total: result.total,
          extraCount: result.extraCount,
          missingCount: result.missingCount,
          wrongCount: result.wrongCount,
          attemptNumber: newAttemptCount,
          timestamp: new Date().toISOString()
        })
      } catch (err) {
        console.error("Erro ao salvar transcrição:", err)
      }
    }
  }

  const handleReset = () => {
    setUserText('')
    setFeedback(null)
    setXpEarned(0)
    setIsNewRecord(false)
  }

  // [v2] Quando fecha o modal, celebratingBadge vira null e useEffect pega o próximo da fila
  const handleBadgeCelebrationComplete = () => {
    setCelebratingBadge(null)
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl max-w-full overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Capa com Breathing Effect */}
      <div className="mb-6 perspective-1000">
        <img 
          src={coverImage} 
          alt={episodeTitle} 
          className={`w-full h-48 object-cover rounded-xl transition-transform duration-500 ${isPlaying ? 'breathing-cover' : ''}`} 
        />
        <p className="text-white font-bold text-center mt-3">{episodeTitle}</p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div 
          className="h-2 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-2 rounded-full smooth-progress relative sexy-progress-bar bg-[#E50914]" 
            style={{ width: `${progress}%` }} 
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
        <div className="flex justify-between text-white/60 text-xs mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(-5)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20 hover:scale-105 transition-all">-5s</motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={togglePlay} 
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-[0_0_20px_rgba(229,9,20,0.6)] hover:scale-105 transition-all z-10"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </motion.button>
        
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(5)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20 hover:scale-105 transition-all">+5s</motion.button>
      </div>

      {/* Velocidades - todas visíveis */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {speeds.map((speed) => (
          <motion.button
            key={speed}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${playbackRate === speed ? 'bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.4)]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3">
        {/* Ditado - esquerda */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenDictation}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shine-effect ${
            showDictation 
              ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Ditado
        </motion.button>

        {/* Quiz - direita */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenQuiz}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shine-effect ${
            showQuiz 
              ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quiz
        </motion.button>
      </div>

      {/* Área de Ditado */}
      <AnimatePresence>
        {showDictation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            {!feedback ? (
              // ========== MODO EDIÇÃO ==========
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
                        onClick={handleCheck}
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
            ) : (
              // ========== MODO RESULTADO ==========
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              >
                {/* Header do resultado */}
                <div className={`p-5 ${
                  feedback.score >= 90 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                    : feedback.score >= 70 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-slate-600 to-slate-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
                        {feedback.score >= 90 ? 'Excelente!' : feedback.score >= 70 ? 'Bom trabalho!' : 'Continue praticando'}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{feedback.score}%</span>
                        <span className="text-white/60 text-sm">de acerto</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/90 text-2xl font-semibold">
                        {feedback.correctCount}<span className="text-white/50 text-lg">/{feedback.total}</span>
                      </div>
                      <p className="text-white/60 text-xs">palavras certas</p>
                    </div>
                  </div>
                  
                  {/* Badges de XP + Recorde + Diamante */}
                  <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-2">
                    {/* XP Badge */}
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
                    >
                      <span className="text-yellow-300 text-sm">⭐</span>
                      <span className="text-white font-bold text-sm">+{xpEarned} XP</span>
                    </motion.div>
                    
                    {/* Novo Recorde Badge */}
                    {isNewRecord && (
                      <motion.div
                        initial={{ scale: 0, rotate: 10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="flex items-center gap-1.5 bg-yellow-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
                      >
                        <span className="text-sm">🏆</span>
                        <span className="text-yellow-100 font-bold text-sm">Novo Recorde!</span>
                      </motion.div>
                    )}
                    
                    {/* Diamond Progress */}
                    {feedback.score >= 95 ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                        className="flex items-center gap-1.5 bg-cyan-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
                      >
                        <span className="text-sm">💎</span>
                        <span className="text-cyan-100 font-bold text-sm">Nível Diamante!</span>
                      </motion.div>
                    ) : feedback.score >= 80 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"
                      >
                        <span className="text-sm opacity-50">💎</span>
                        <span className="text-white/70 text-xs">Faltam {95 - feedback.score}% para 💎</span>
                      </motion.div>
                    ) : null}
                  </div>
                </div>

                {/* Corpo do resultado */}
                <div className="bg-[#FAF8F5] p-5">
                  <p className="text-[#8B7E6A] text-xs font-medium uppercase tracking-wider mb-3">
                    Sua transcrição
                  </p>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E2D9] leading-relaxed text-lg">
                    {feedback.diffResult.map((item, idx) => {
                      if (item.type === 'title') {
                        return <span key={idx} className="text-slate-300 text-sm mr-1">{item.word}</span>
                      }
                      
                      if (item.type === 'correct') {
                        return <span key={idx} className="text-[#3D3529]">{item.word} </span>
                      }
                      
                      if (item.type === 'missing') {
                        return (
                          <span 
                            key={idx} 
                            className="inline-block bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mx-0.5 font-medium"
                            title="Faltou esta palavra"
                          >
                            {item.word}
                          </span>
                        )
                      }
                      
                      if (item.type === 'extra') {
                        return (
                          <span 
                            key={idx} 
                            className="text-slate-400 line-through decoration-slate-300 text-base mx-0.5"
                          >
                            {item.word}
                          </span>
                        )
                      }
                      
                      return (
                        <span key={idx} className="inline-flex items-baseline mx-0.5">
                          <span className="text-red-400 line-through decoration-red-300 text-base">{item.word}</span>
                          <span className="text-emerald-600 font-medium ml-1">{item.expected}</span>
                        </span>
                      )
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#E8E2D9] justify-center">
                    <span className="flex items-center gap-1.5 text-xs text-[#8B7E6A]">
                      <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></span>
                      Faltou
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#8B7E6A]">
                      <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></span>
                      Correção
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#8B7E6A]">
                      <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 relative">
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-full h-px bg-slate-400 rotate-[-10deg]"></span>
                        </span>
                      </span>
                      Extra
                    </span>
                  </div>

                  {/* Botão tentar novamente */}
                  <motion.button 
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleReset}
                    className="w-full mt-5 py-4 rounded-xl bg-[#1A1A1A] text-white font-semibold hover:bg-[#2A2A2A] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Tentar Novamente
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* [v2] Modal de celebração - agora recebe badge (string) ao invés de badges (array) */}
      <BadgeCelebrationModal 
        badge={celebratingBadge} 
        onComplete={handleBadgeCelebrationComplete} 
      />
    </div>
  )
}