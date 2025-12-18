import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- FERRAMENTAS DE NORMALIZAÇÃO ---

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

// Algoritmo Sherlock (Mantido igual, pois a lógica é boa)
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
    
    // Hipótese A: Extra
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

    // Hipótese B: Missing
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

    // Hipótese C: Wrong
    diffResult.push({ type: 'wrong', word: userWordRaw, expected: origWordRaw })
    oIndex++
    uIndex++
  }

  const score = Math.round((correctCount / originalTokens.length) * 100)
  return { diffResult, score, correctCount, total: originalTokens.length }
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

  // --- EFEITOS DE ÁUDIO (Mantidos) ---
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
    <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl max-w-full overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Capa */}
      <div className="mb-6">
        <img 
          src={coverImage} 
          alt={episodeTitle}
          className="w-full h-48 object-cover rounded-xl"
        />
        <p className="text-white font-bold text-center mt-3">{episodeTitle}</p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-6">
        <div 
          className="h-2 bg-white/20 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-2 bg-[#E50914] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-white/50 text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles principais */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(-5)}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <span className="text-xs font-bold">-5s</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white text-2xl hover:bg-[#B20710] transition-colors shadow-lg"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(5)}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <span className="text-xs font-bold">+5s</span>
        </motion.button>
      </div>

      {/* Velocidades */}
      <div className="flex items-center justify-center gap-2">
        {speeds.map((speed) => (
          <motion.button
            key={speed}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              playbackRate === speed
                ? 'bg-[#E50914] text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>

      <p className="text-white/50 text-center text-sm mt-4">
        🎧 Ouça com atenção
      </p>

      {/* Botão Ditado */}
      {transcript && (
        <div className="mt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowDictation(!showDictation)
              if (!showDictation) setFeedback(null)
            }}
            className="w-full py-3 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 rounded-xl text-[#F59E0B] font-medium transition-colors flex items-center justify-center gap-2 border border-[#F59E0B]/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {showDictation ? 'Fechar Ditado' : 'Praticar Escrita'}
          </motion.button>

          {/* Área de Ditado */}
          <AnimatePresence>
            {showDictation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-white/5 rounded-xl overflow-hidden border border-white/5"
              >
                {!feedback ? (
                  <div className="p-4">
                    <p className="text-white/70 text-sm mb-3">
                      Ouça o áudio e escreva o que entender:
                    </p>
                    
                    <textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="Digite aqui o que você ouviu..."
                      className="w-full h-32 p-3 rounded-lg bg-black/30 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#F59E0B] border border-white/10"
                    />
                    
                    <div className="flex gap-2 mt-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCheck}
                        disabled={!userText.trim()}
                        className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-colors shadow-lg"
                      >
                        Verificar Resposta
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReset}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                      >
                        Limpar
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  /* Feedback Visual Otimizado */
                  <div className="p-4">
                    {/* Score Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                      <div>
                        <span className="text-white/50 text-xs uppercase tracking-wider">Pontuação</span>
                        <div className={`text-2xl font-bold ${
                          feedback.score >= 80 ? 'text-green-400' :
                          feedback.score >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {feedback.score}%
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="text-white/50 text-xs uppercase tracking-wider">Palavras</span>
                         <div className="text-white text-sm">
                           {feedback.correctCount} / {feedback.total}
                         </div>
                      </div>
                    </div>

                    {/* Texto com Feedback */}
                    {/* Aqui está o segredo do overflow: flex-wrap e break-words */}
                    <div className="bg-black/30 rounded-lg p-4 leading-loose flex flex-wrap gap-1.5 break-words font-light text-base">
                      {feedback.diffResult.map((item, idx) => {
                        // Correto: Branco (neutro)
                        if (item.type === 'correct') {
                          return <span key={idx} className="text-white/90">{item.word}</span>
                        }
                        // Faltou: Amarelo sublinhado
                        if (item.type === 'missing') {
                          return (
                            <span key={idx} className="text-yellow-500/80 border-b border-yellow-500/50 border-dashed" title="Palavra faltando">
                              {item.word}
                            </span>
                          )
                        }
                        // Extra: Vermelho riscado
                        if (item.type === 'extra') {
                          return (
                            <span key={idx} className="text-red-500/60 line-through text-sm">
                              {item.word}
                            </span>
                          )
                        }
                        // Errado: Vermelho riscado + Correção verde
                        return (
                          <span key={idx} className="inline-flex flex-wrap items-baseline gap-1">
                            <span className="text-red-500/60 line-through text-sm decoration-1">{item.word}</span>
                            <span className="text-green-400 font-medium">{item.expected}</span>
                          </span>
                        )
                      })}
                    </div>

                    {/* Legenda Prática */}
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/40 justify-center border-t border-white/5 pt-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/90"></span> Correto</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/60"></span> Erro</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Correção</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500/80"></span> Faltou</span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                      className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                    >
                      Tentar Novamente
                    </motion.button>
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