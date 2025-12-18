import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONFIGURAÇÕES E UTILITÁRIOS ---

// Mapa de expansão para garantir robustez (I'm -> i am)
const CONTRACTIONS = {
  "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is",
  "we're": "we are", "they're": "they are", "isn't": "is not", "aren't": "are not",
  "wasn't": "was not", "weren't": "were not", "don't": "do not", "doesn't": "does not",
  "didn't": "did not", "won't": "will not", "can't": "can not", "cannot": "can not",
  "couldn't": "could not", "that's": "that is", "what's": "what is", "let's": "let us",
  "gonna": "going to", "wanna": "want to", "gotta": "got to"
}

const NUMBER_WORDS = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve'
}

// Normaliza e "explode" o texto em tokens comparáveis
function normalizeAndTokenize(text) {
  if (!text) return []
  
  // 1. Lowercase e conversão de números
  let clean = text.toLowerCase()
  clean = clean.replace(/\b\d+\b/g, (match) => NUMBER_WORDS[match] || match)

  // 2. Limpeza de pontuação (mantém apenas letras, números e apóstrofos internos)
  clean = clean.replace(/[^a-z0-9'\s]/g, ' ')
  
  // 3. Tokenização inicial
  let tokens = clean.split(/\s+/).filter(w => w)
  let expandedTokens = []

  // 4. Expansão de contrações
  tokens.forEach(token => {
    // Remove aspas das pontas ('cause -> cause)
    let coreWord = token.replace(/^'+|'+$/g, '')
    
    if (CONTRACTIONS[coreWord]) {
      // Se for contração, expande (ex: ["i", "am"])
      expandedTokens.push(...CONTRACTIONS[coreWord].split(' '))
    } else {
      // Se não, usa a palavra limpa (sem apóstrofos internos para normalizar: o'clock -> oclock)
      expandedTokens.push(coreWord.replace(/'/g, ''))
    }
  })

  return expandedTokens
}

// Algoritmo de Comparação (Comparando Tokens com Tokens)
function calculateDiff(originalText, userText) {
  const origTokens = normalizeAndTokenize(originalText)
  const userTokens = normalizeAndTokenize(userText)

  const diffResult = []
  let uIndex = 0
  let oIndex = 0
  let correctCount = 0

  while (oIndex < origTokens.length || uIndex < userTokens.length) {
    const origNorm = origTokens[oIndex]
    const userNorm = userTokens[uIndex]

    // 1. Acabou User (Faltou palavra)
    if (origNorm && !userNorm) {
      diffResult.push({ type: 'missing', word: origNorm })
      oIndex++
      continue
    }

    // 2. Acabou Original (Palavra Extra)
    if (!origNorm && userNorm) {
      diffResult.push({ type: 'extra', word: userNorm })
      uIndex++
      continue
    }

    // 3. Match Perfeito
    if (origNorm === userNorm) {
      diffResult.push({ type: 'correct', word: origNorm })
      correctCount++
      oIndex++
      uIndex++
      continue
    }

    // 4. Lookahead (Sincronização Inteligente)
    let foundMatch = false

    // A: User adicionou extra?
    for (let offset = 1; offset <= 3; offset++) {
      if (uIndex + offset < userTokens.length) {
        if (origNorm === userTokens[uIndex + offset]) {
          for (let k = 0; k < offset; k++) {
            diffResult.push({ type: 'extra', word: userTokens[uIndex + k] })
          }
          uIndex += offset
          foundMatch = true
          break
        }
      }
    }
    if (foundMatch) continue

    // B: User esqueceu?
    for (let offset = 1; offset <= 3; offset++) {
      if (oIndex + offset < origTokens.length) {
        if (userNorm === origTokens[oIndex + offset]) {
          for (let k = 0; k < offset; k++) {
             diffResult.push({ type: 'missing', word: origTokens[oIndex + k] })
          }
          oIndex += offset
          foundMatch = true
          break
        }
      }
    }
    if (foundMatch) continue

    // C: Erro (Substituição)
    diffResult.push({ type: 'wrong', word: userNorm, expected: origNorm })
    oIndex++
    uIndex++
  }

  const score = origTokens.length > 0 
    ? Math.round((correctCount / origTokens.length) * 100) 
    : 0
  
  return { diffResult, score, correctCount, total: origTokens.length }
}

export default function AudioPlayer({ audioUrl, coverImage, episodeTitle, initialTime, onTimeUpdate, transcript }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  const [showDictation, setShowDictation] = useState(false)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState(null)

  const speeds = [0.5, 0.75, 1, 1.25, 1.5]

  // --- EFEITOS ---
  
  // Carrega metadados e seta tempo inicial
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

  // Atualiza tempo corrente e estado de play
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Auto-save a cada 10s
  useEffect(() => {
    if (!onTimeUpdate) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        onTimeUpdate(audioRef.current.currentTime)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [onTimeUpdate])

  // Função para salvar imediatamente ao pausar
  const handlePause = () => {
    if (onTimeUpdate && audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
      handlePause() // Salva o progresso ao pausar
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const changeSpeed = (speed) => {
    setPlaybackRate(speed)
    audioRef.current.playbackRate = speed
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
  }

  const handleCheck = () => {
    if (!userText.trim() || !transcript) return
    const result = calculateDiff(transcript, userText)
    setFeedback(result)
  }

  const handleReset = () => {
    setUserText('')
    setFeedback(null)
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl max-w-full overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Capa */}
      <div className="mb-6">
        <img src={coverImage} alt={episodeTitle} className="w-full h-48 object-cover rounded-xl shadow-lg" />
        <p className="text-white font-bold text-center mt-3">{episodeTitle}</p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div 
          className="h-2 bg-white/20 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <motion.div className="h-2 bg-[#E50914] rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-white/50 text-sm">
          <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles (Com SVGs) */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => audioRef.current.currentTime -= 5} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20">-5s</motion.button>
        
        <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay} className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#B20710]">
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </motion.button>
        
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => audioRef.current.currentTime += 5} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20">+5s</motion.button>
      </div>

      {/* Velocidades */}
      <div className="flex items-center justify-center gap-2">
        {speeds.map((speed) => (
          <motion.button
            key={speed}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${playbackRate === speed ? 'bg-[#E50914] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>

      {/* Botão Ditado */}
      {transcript && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowDictation(!showDictation); if(showDictation) setFeedback(null); }}
            className="w-full py-3 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 rounded-xl text-[#F59E0B] font-medium transition-colors flex items-center justify-center gap-2 border border-[#F59E0B]/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {showDictation ? 'Fechar Ditado' : 'Praticar Escrita'}
          </motion.button>

          <AnimatePresence>
            {showDictation && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 bg-white/5 rounded-xl overflow-hidden border border-white/5">
                {!feedback ? (
                  <div className="p-4">
                    <p className="text-white/70 text-sm mb-3">Ouça e escreva:</p>
                    <textarea
                      value={userText} onChange={(e) => setUserText(e.target.value)} placeholder="Digite aqui..."
                      className="w-full h-32 p-3 rounded-lg bg-black/30 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#F59E0B] border border-white/10 leading-relaxed font-light"
                    />
                    <div className="flex gap-2 mt-3">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleCheck} disabled={!userText.trim()} className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-white font-bold transition-colors shadow-lg">Verificar</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleReset} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium">Limpar</motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                      <div>
                        <span className="text-white/50 text-xs uppercase tracking-wider">Pontuação</span>
                        <div className={`text-2xl font-bold ${feedback.score >= 90 ? 'text-green-400' : feedback.score >= 70 ? 'text-yellow-400' : 'text-white/60'}`}>{feedback.score}%</div>
                      </div>
                      <div className="text-right">
                         <span className="text-white/50 text-xs uppercase tracking-wider">Tokens</span>
                         <div className="text-white text-sm">{feedback.correctCount} / {feedback.total}</div>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-4 leading-loose flex flex-wrap gap-1.5 break-words font-light text-base">
                      {feedback.diffResult.map((item, idx) => {
                        if (item.type === 'correct') return <span key={idx} className="text-white/90">{item.word}</span>
                        if (item.type === 'missing') return <span key={idx} className="text-yellow-500/80 border-b border-yellow-500/50 border-dashed" title="Faltou">{item.word}</span>
                        if (item.type === 'extra') return <span key={idx} className="text-white/20 line-through text-sm decoration-white/10 select-none">{item.word}</span>
                        return (
                          <span key={idx} className="inline-flex flex-wrap items-baseline gap-1">
                            <span className="text-red-400/60 line-through text-sm decoration-red-400/30">{item.word}</span>
                            <span className="text-green-400 font-medium">{item.expected}</span>
                          </span>
                        )
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/40 justify-center border-t border-white/5 pt-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/90"></span> Correto</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400/60"></span> Erro</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Correção</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500/80"></span> Faltou</span>
                    </div>

                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleReset} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors">Tentar Novamente</motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}