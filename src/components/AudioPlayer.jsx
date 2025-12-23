import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateDiff } from '../utils/dictationDiff'
import { useAuth } from '../contexts/AuthContext'

// ============================================
// TYPING SOUND ENGINE (Web Audio API)
// Som de teclado mecânico satisfatório
// ============================================
class TypingSoundEngine {
  constructor() {
    this.audioContext = null
    this.enabled = true
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  play() {
    if (!this.enabled || !this.audioContext) return
    
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const now = this.audioContext.currentTime

    // Oscilador principal (click)
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    // Som tipo Cherry MX - curto e satisfatório
    osc.type = 'square'
    osc.frequency.setValueAtTime(1800, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.02)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(3000, now)
    filter.Q.setValueAtTime(1, now)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.start(now)
    osc.stop(now + 0.05)

    // Segundo click sutil (bounce do keycap)
    setTimeout(() => {
      if (!this.enabled || !this.audioContext) return
      
      const osc2 = this.audioContext.createOscillator()
      const gain2 = this.audioContext.createGain()
      
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(800, this.audioContext.currentTime)
      
      gain2.gain.setValueAtTime(0.02, this.audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.02)
      
      osc2.connect(gain2)
      gain2.connect(this.audioContext.destination)
      
      osc2.start()
      osc2.stop(this.audioContext.currentTime + 0.02)
    }, 15)
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
  const { user, saveTranscription } = useAuth()
  
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
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5]
  const typingTimeoutRef = useRef(null)

  // Contador de palavras
  const wordCount = userText.trim() ? userText.trim().split(/\s+/).length : 0

  // Inicializa o engine de som no primeiro interaction
  useEffect(() => {
    const initSound = () => {
      typingSound.init()
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

  const handlePause = () => {
    if (onTimeUpdate && audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime)
    }
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
        handlePause()
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (err) {
      console.error("Playback error:", err)
      setIsPlaying(false)
    }
  }

  const skip = (seconds) => {
    if (!audioRef.current) return
    const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration)
    audioRef.current.currentTime = newTime
  }

  const changeSpeed = (speed) => {
    setPlaybackRate(speed)
    if(audioRef.current) audioRef.current.playbackRate = speed
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if(audioRef.current) audioRef.current.currentTime = percent * duration
  }

  // Handler de digitação com som
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

  // Verificar transcrição + Auto-save
  const handleCheck = async () => {
    if (!userText.trim() || !transcript) return
    
    const result = calculateDiff(transcript, userText, episodeTitle)
    setFeedback(result)
    
    const newAttemptCount = attemptCount + 1
    setAttemptCount(newAttemptCount)
    
    // [v10.3] AUTO-SAVE da transcrição
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
        // Não bloqueia a UX se falhar
      }
    }
  }

  const handleReset = () => {
    setUserText('')
    setFeedback(null)
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
        <div className="flex justify-between mt-2 text-white/50 text-sm">
          <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 mb-6">
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

      {/* Velocidades */}
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

      {/* Botões de Ação */}
      <div className="border-t border-white/10 pt-4 flex flex-wrap justify-center gap-3">
        
        {/* Botão Praticar Escrita */}
        {transcript && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { 
              const newState = !showDictation
              setShowDictation(newState)
              if (newState) setFeedback(null)
              if (newState && showQuiz) setShowQuiz(false)
            }}
            className={`w-fit px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 border ${showDictation ? 'bg-[#F59E0B] text-black border-[#F59E0B]' : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 hover:bg-[#F59E0B]/20'} shine-effect`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            {showDictation ? 'Fechar' : 'Praticar Escrita'}
          </motion.button>
        )}

        {/* Botão Quiz */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
             const newState = !showQuiz
             setShowQuiz(newState)
             if (newState && showDictation) setShowDictation(false)
          }}
          className={`w-fit px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 border ${showQuiz ? 'bg-[#E50914] text-white border-[#E50914]' : 'bg-[#E50914]/10 text-[#E50914] border-[#E50914]/20 hover:bg-[#E50914]/20'} shine-effect`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {showQuiz ? 'Esconder Quiz' : 'Responder Quiz'}
        </motion.button>
      </div>

      {/* ============================================ */}
      {/* ÁREA DE DITADO — THE GOLD                   */}
      {/* ============================================ */}
      {transcript && (
        <AnimatePresence>
          {showDictation && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="mt-6"
            >
              {!feedback ? (
                // ========== MODO ESCRITA ==========
                <div className="relative">
                  <motion.div 
                    className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                      isFocused 
                        ? 'shadow-[0_0_0_2px_rgba(245,158,11,0.5),0_8px_32px_rgba(0,0,0,0.3)]' 
                        : 'shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                    }`}
                    animate={isTyping ? { scale: [1, 1.002, 1] } : {}}
                    transition={{ duration: 0.1 }}
                  >
                    {/* Fundo texturizado premium */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FAF8F5] via-[#F7F5F2] to-[#F0EDE8]" />
                    
                    {/* Textura sutil de papel */}
                    <div 
                      className="absolute inset-0 opacity-[0.02]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                      }}
                    />
                    
                    {/* Linhas de caderno refinadas */}
                    <div 
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #64748b 31px, #64748b 32px)',
                        backgroundPosition: '0 16px'
                      }}
                    />

                    {/* Barra lateral estilo Moleskine */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 ${
                      isFocused 
                        ? 'bg-gradient-to-b from-[#F59E0B] via-[#F59E0B] to-[#D97706] shadow-[2px_0_8px_rgba(245,158,11,0.3)]' 
                        : 'bg-gradient-to-b from-[#E5E0D8] to-[#D4CFC5]'
                    }`} />

                    {/* Conteúdo */}
                    <div className="relative p-5 pl-7">
                      {/* Header com toggle de som */}
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[#8B7E6A] text-sm font-medium tracking-wide">
                          Ouça e escreva o que entender
                        </p>
                        <div className="flex items-center gap-3">
                          {/* Toggle de som */}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleTypingSound}
                            className={`p-1.5 rounded-lg transition-all ${
                              typingSoundEnabled 
                                ? 'text-[#F59E0B] bg-[#F59E0B]/10' 
                                : 'text-[#C4B8A5] hover:text-[#8B7E6A]'
                            }`}
                            title={typingSoundEnabled ? 'Desativar som' : 'Ativar som'}
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
                          </motion.button>
                          
                          {/* Contador de palavras */}
                          <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: wordCount > 0 ? 1 : 0.3 }}
                            className="text-[#B8A990] text-xs font-medium tabular-nums"
                          >
                            {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
                          </motion.span>
                        </div>
                      </div>

                      {/* Textarea com feedback de digitação */}
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={userText}
                          onChange={handleTextChange}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Start typing here..."
                          className="w-full h-48 bg-transparent text-[#3D3529] placeholder-[#C4B8A5] text-lg leading-8 resize-none focus:outline-none font-light tracking-wide"
                          style={{ caretColor: '#F59E0B' }}
                          spellCheck={false}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                        />
                        
                        {/* Indicador de digitação ativa */}
                        <AnimatePresence>
                          {isTyping && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute bottom-2 right-2 w-2 h-2 bg-[#F59E0B] rounded-full"
                            />
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-[#E8E2D9]">
                        <motion.button 
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCheck}
                          disabled={!userText.trim()}
                          className={`flex-1 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                            userText.trim() 
                              ? 'bg-[#1A1A1A] text-white shadow-md hover:shadow-lg hover:bg-[#2A2A2A]' 
                              : 'bg-[#E8E2D9] text-[#B8A990] cursor-not-allowed'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verificar
                        </motion.button>
                        
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleReset}
                          className="px-5 py-3.5 rounded-xl text-[#8B7E6A] hover:text-[#5C5346] hover:bg-[#E8E2D9] transition-all text-sm font-medium"
                        >
                          Limpar
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
                    
                    {/* Badge de tentativa */}
                    {attemptCount > 1 && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <span className="text-white/50 text-xs">
                          Tentativa #{attemptCount} • Transcrição salva automaticamente
                        </span>
                      </div>
                    )}
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
      )}
    </div>
  )
}