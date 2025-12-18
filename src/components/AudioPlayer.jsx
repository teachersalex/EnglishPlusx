import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- FERRAMENTAS DO SHERLOCK 🕵️‍♂️ ---

const numberWords = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve'
}

// Normaliza mantendo a integridade da palavra
function normalizeWord(word) {
  if (!word) return ''
  // 1. Lowercase
  let clean = word.toLowerCase()
  // 2. Remove pontuação APENAS do início e fim (preserva ' no meio, ex: don't, o'clock)
  clean = clean.replace(/^[.,!?;:"()\-]+|[.,!?;:"()\-]+$/g, '')
  // 3. Converte números
  if (numberWords[clean]) clean = numberWords[clean]
  
  return clean
}

// O Cérebro da Correção: Algoritmo de Alinhamento com "Lookahead"
function calculateDiff(originalText, userText) {
  // Quebra por quebras de linha primeiro para preservar estrutura visual
  // Mas para comparar a lógica, vamos usar arrays planos de palavras
  const originalTokens = originalText.split(/\s+/).filter(w => w)
  const userTokens = userText.split(/\s+/).filter(w => w)

  const diffResult = []
  let uIndex = 0 // Ponteiro do usuario
  let oIndex = 0 // Ponteiro do original
  let correctCount = 0

  while (oIndex < originalTokens.length || uIndex < userTokens.length) {
    const origWordRaw = originalTokens[oIndex]
    const userWordRaw = userTokens[uIndex]
    
    const origNorm = normalizeWord(origWordRaw)
    const userNorm = normalizeWord(userWordRaw)

    // 1. Acabou um dos lados
    if (!origWordRaw && userWordRaw) {
      diffResult.push({ type: 'extra', word: userWordRaw })
      uIndex++
      continue
    }
    if (origWordRaw && !userWordRaw) {
      diffResult.push({ type: 'missing', word: origWordRaw })
      oIndex++
      continue
    }

    // 2. Match Perfeito
    if (origNorm === userNorm) {
      diffResult.push({ type: 'correct', word: origWordRaw })
      correctCount++
      oIndex++
      uIndex++
      continue
    }

    // 3. Não bateu. Vamos investigar (Lookahead)
    let foundMatch = false
    
    // Hipótese A: O aluno inseriu uma palavra extra
    for (let offset = 1; offset <= 3; offset++) {
      if (uIndex + offset < userTokens.length) {
        if (origNorm === normalizeWord(userTokens[uIndex + offset])) {
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

    // Hipótese B: O aluno esqueceu palavras
    for (let offset = 1; offset <= 3; offset++) {
      if (oIndex + offset < originalTokens.length) {
        if (userNorm === normalizeWord(originalTokens[oIndex + offset])) {
          for (let k = 0; k < offset; k++) {
            diffResult.push({ type: 'missing', word: originalTokens[oIndex + k] })
          }
          oIndex += offset 
          foundMatch = true
          break
        }
      }
    }

    if (foundMatch) continue

    // Hipótese C: Erro de substituição
    diffResult.push({ type: 'wrong', word: userWordRaw, expected: origWordRaw })
    oIndex++
    uIndex++
  }

  const score = Math.round((correctCount / originalTokens.length) * 100)
  
  return { diffResult, score }
}

export default function AudioPlayer({ audioUrl, coverImage, episodeTitle, initialTime, onTimeUpdate, transcript }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  // Estados UI (Sem showTranscript!)
  const [showDictation, setShowDictation] = useState(false)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState(null)

  const speeds = [0.5, 0.75, 1, 1.25, 1.5]

  // --- EFEITOS DE AUDIO ---
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
    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    if (!onTimeUpdate) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        onTimeUpdate(audioRef.current.currentTime)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [onTimeUpdate])

  const handlePause = () => {
    if (onTimeUpdate && audioRef.current) onTimeUpdate(audioRef.current.currentTime)
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
      handlePause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skip = (seconds) => {
    audioRef.current.currentTime += seconds
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

  // --- LÓGICA DO DITADO ---

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
    <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Capa */}
      <div className="mb-6 relative group">
        <img 
          src={coverImage} 
          alt={episodeTitle}
          className="w-full h-48 object-cover rounded-xl shadow-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-xl flex items-end justify-center pb-4">
            <p className="text-white font-bold text-lg">{episodeTitle}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div 
          className="h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-2 bg-[#E50914] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-white/50 text-xs font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(-5)}
          className="text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
          </svg>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-900/40"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(5)}
          className="text-white/70 hover:text-white transition-colors"
        >
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
          </svg>
        </motion.button>
      </div>

      {/* Velocidades */}
      <div className="flex justify-center gap-2 mb-6">
        {speeds.map((speed) => (
          <button
            key={speed}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              playbackRate === speed ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        
        {/* Toggle Ditado (Sem botão de espiar antes) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowDictation(!showDictation)
            if (!showDictation) setFeedback(null)
          }}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            showDictation ? 'bg-white/10 text-white' : 'bg-[#E50914] text-white shadow-lg shadow-red-900/20'
          }`}
        >
          {showDictation ? 'Fechar Modo Prática' : '✍️ Praticar Escrita (Ditado)'}
        </motion.button>

        {/* AREA DO DITADO */}
        <AnimatePresence>
          {showDictation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#121212] rounded-xl border border-white/10 p-1 mt-2">
                {!feedback ? (
                  <>
                    <textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="Ouça o áudio e digite o que você escutar..."
                      className="w-full h-40 bg-transparent text-white p-4 text-base resize-none focus:outline-none placeholder-white/30 leading-relaxed"
                      spellCheck={false}
                    />
                    <div className="flex gap-2 p-2 bg-white/5 rounded-b-lg">
                      <button 
                        onClick={handleCheck}
                        disabled={!userText.trim()}
                        className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-colors"
                      >
                        Verificar Resposta
                      </button>
                    </div>
                  </>
                ) : (
                  // --- AREA DE FEEDBACK VISUAL ---
                  <div className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-white/50 text-sm">Sua precisão:</span>
                      <span className={`text-xl font-bold ${feedback.score >= 80 ? 'text-[#22C55E]' : 'text-[#E50914]'}`}>
                        {feedback.score}%
                      </span>
                    </div>

                    <div className="bg-black/40 rounded-lg p-4 text-base leading-loose whitespace-pre-wrap">
                      {feedback.diffResult.map((item, idx) => {
                        // Renderização condicional dos tokens
                        if (item.type === 'correct') {
                          return <span key={idx} className="text-white/90 mr-1.5">{item.word}</span>
                        }
                        if (item.type === 'missing') {
                          return (
                            <span key={idx} className="inline-flex flex-col items-center mx-1 align-middle group relative">
                              <span className="h-4 w-8 border-b-2 border-[#E50914]/50 border-dashed"></span>
                              <span className="absolute -top-4 text-[10px] text-[#E50914] bg-red-900/90 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Faltou: {item.word}
                              </span>
                            </span>
                          )
                        }
                        if (item.type === 'extra') {
                          return <span key={idx} className="text-[#E50914] line-through decoration-2 decoration-[#E50914]/50 mr-1.5 opacity-60">{item.word}</span>
                        }
                        // Wrong (Substituição)
                        return (
                          <span key={idx} className="inline-block mr-1.5 relative group">
                            <span className="text-[#E50914] line-through decoration-2">{item.word}</span>
                            <span className="text-[#22C55E] font-medium ml-1 underline decoration-dotted underline-offset-4 cursor-help">
                              {item.expected}
                            </span>
                          </span>
                        )
                      })}
                    </div>

                    <div className="mt-4 flex gap-3">
                        <button 
                          onClick={handleReset}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors"
                        >
                          Tentar Novamente
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}