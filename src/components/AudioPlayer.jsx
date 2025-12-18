import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- LÓGICA DE CORREÇÃO (MANTIDA) ---

const numberWords = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve'
}

function normalizeWord(word) {
  if (!word) return ''
  let clean = word.toLowerCase()
  clean = clean.replace(/^[.,!?;:"()\-]+|[.,!?;:"()\-]+$/g, '')
  if (numberWords[clean]) clean = numberWords[clean]
  return clean
}

function calculateDiff(originalText, userText) {
  const originalTokens = originalText.split(/\s+/).filter(w => w)
  const userTokens = userText.split(/\s+/).filter(w => w)

  const diffResult = []
  let uIndex = 0
  let oIndex = 0
  let correctCount = 0

  while (oIndex < originalTokens.length || uIndex < userTokens.length) {
    const origWordRaw = originalTokens[oIndex]
    const userWordRaw = userTokens[uIndex]
    const origNorm = normalizeWord(origWordRaw)
    const userNorm = normalizeWord(userWordRaw)

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

    if (origNorm === userNorm) {
      diffResult.push({ type: 'correct', word: origWordRaw })
      correctCount++
      oIndex++
      uIndex++
      continue
    }

    let foundMatch = false
    
    // Hipótese A: Palavra extra
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

    // Hipótese B: Palavra faltando
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

    // Hipótese C: Erro
    diffResult.push({ type: 'wrong', word: userWordRaw, expected: origWordRaw })
    oIndex++
    uIndex++
  }

  const score = Math.round((correctCount / originalTokens.length) * 100)
  return { diffResult, score }
}

// --- COMPONENTE ---

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
      <div className="mb-6 text-center">
        <img 
          src={coverImage} 
          alt={episodeTitle}
          className="w-48 h-48 object-cover rounded-xl shadow-lg mx-auto"
        />
        <p className="text-white font-bold text-lg mt-4">{episodeTitle}</p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div 
          className="h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden hover:h-2 transition-all"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-full bg-[#E50914] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-white/40 text-xs font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles Principais */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {/* Botão Voltar 5s */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => skip(-5)}
          className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/5 hover:text-white hover:border-white/30 transition-all text-xs font-bold"
        >
          -5s
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-900/20"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </motion.button>

        {/* Botão Avançar 5s */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => skip(5)}
          className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/5 hover:text-white hover:border-white/30 transition-all text-xs font-bold"
        >
          +5s
        </motion.button>
      </div>

      {/* Velocidades */}
      <div className="flex justify-center gap-2 mb-8">
        {speeds.map((speed) => (
          <button
            key={speed}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
              playbackRate === speed 
                ? 'bg-white/20 text-white' 
                : 'bg-transparent text-white/30 hover:text-white/70'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Botão de Ditado (Modificado: Cinza e sem Emoji) */}
      <div className="border-t border-white/10 pt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowDictation(!showDictation)
            if (!showDictation) setFeedback(null)
          }}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
            showDictation 
              ? 'bg-white/5 text-white/60' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {showDictation ? 'Fechar Ditado' : 'Praticar Escrita'}
        </motion.button>

        <AnimatePresence>
          {showDictation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4">
                {!feedback ? (
                  <>
                    <textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="Ouça e digite aqui..."
                      className="w-full h-32 bg-[#121212] text-white p-4 text-sm rounded-lg border border-white/10 focus:border-[#E50914]/50 focus:outline-none resize-none leading-relaxed"
                      spellCheck={false}
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={handleCheck}
                        disabled={!userText.trim()}
                        className="bg-[#E50914] hover:bg-[#b20710] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-2 px-6 rounded-lg transition-colors"
                      >
                        Verificar
                      </button>
                    </div>
                  </>
                ) : (
                  // FEEDBACK DISCRETO (Sem Emojis)
                  <div className="bg-[#121212] rounded-lg p-4 border border-white/10">
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40 text-xs uppercase tracking-wider">Resultado</span>
                      <span className={`text-lg font-bold ${feedback.score >= 80 ? 'text-green-500' : 'text-red-500'}`}>
                        {feedback.score}%
                      </span>
                    </div>

                    <div className="text-sm leading-loose text-white/80 whitespace-pre-wrap font-light">
                      {feedback.diffResult.map((item, idx) => {
                        // Correto (texto normal)
                        if (item.type === 'correct') {
                          return <span key={idx} className="text-white mr-1.5">{item.word}</span>
                        }
                        
                        // Faltou (Underline discreto)
                        if (item.type === 'missing') {
                          return (
                            <span key={idx} className="inline-block mx-1 text-red-400/50 border-b border-red-500/50 border-dashed px-1" title={`Faltou: ${item.word}`}>
                              ___
                            </span>
                          )
                        }
                        
                        // Extra (Riscado discreto)
                        if (item.type === 'extra') {
                          return <span key={idx} className="text-red-400 line-through decoration-1 opacity-60 mr-1.5">{item.word}</span>
                        }
                        
                        // Errado (Vermelho riscado + Verde sugerido)
                        return (
                          <span key={idx} className="inline-block mr-1.5">
                            <span className="text-red-400 line-through decoration-1 mr-1">{item.word}</span>
                            <span className="text-green-400 font-medium">{item.expected}</span>
                          </span>
                        )
                      })}
                    </div>

                    <div className="mt-4 text-right">
                        <button 
                          onClick={handleReset}
                          className="text-xs text-white/40 hover:text-white transition-colors underline decoration-dotted"
                        >
                          Tentar novamente
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