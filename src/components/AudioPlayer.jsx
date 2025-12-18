import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- FERRAMENTAS DE NORMALIZAÇÃO ---

const numberWords = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve'
}

// Normaliza preservando apóstrofos no meio (don't, o'clock)
function normalizeWord(word) {
  if (!word) return ''
  let clean = word.toLowerCase()
  // Remove pontuação apenas do início e fim
  clean = clean.replace(/^[.,!?;:"()\-]+|[.,!?;:"()\-]+$/g, '')
  if (numberWords[clean]) clean = numberWords[clean]
  return clean
}

// Algoritmo de Alinhamento com Lookahead
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

    // Acabou um dos lados
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

    // Match perfeito
    if (origNorm === userNorm) {
      diffResult.push({ type: 'correct', word: origWordRaw })
      correctCount++
      oIndex++
      uIndex++
      continue
    }

    // Lookahead: procura sincronização
    let foundMatch = false
    
    // Hipótese A: Aluno inseriu palavras extras
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

    // Hipótese B: Aluno pulou palavras
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

    // Hipótese C: Substituição/erro
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
  
  // Estados do ditado
  const [showDictation, setShowDictation] = useState(false)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState(null)

  const speeds = [0.5, 0.75, 1, 1.25, 1.5]

  // --- EFEITOS DE ÁUDIO ---
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
            className="w-full py-3 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 rounded-xl text-[#F59E0B] font-medium transition-colors flex items-center justify-center gap-2"
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
                className="mt-3 bg-white/10 rounded-xl p-4 overflow-hidden"
              >
                {!feedback ? (
                  <>
                    <p className="text-white/70 text-sm mb-3">
                      Ouça o áudio e escreva o que entender:
                    </p>
                    
                    <textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="Digite aqui o que você ouviu..."
                      className="w-full h-32 p-3 rounded-lg bg-white/10 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                    />
                    
                    <div className="flex gap-2 mt-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCheck}
                        disabled={!userText.trim()}
                        className="flex-1 py-2 bg-[#22C55E] hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                      >
                        Verificar
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReset}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                      >
                        Limpar
                      </motion.button>
                    </div>
                  </>
                ) : (
                  /* Feedback Visual */
                  <div>
                    {/* Score */}
                    <div className={`text-center p-3 rounded-lg mb-4 ${
                      feedback.score >= 80 ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                      feedback.score >= 50 ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                      'bg-[#EF4444]/20 text-[#EF4444]'
                    }`}>
                      <span className="text-3xl font-bold">{feedback.score}%</span>
                      <p className="text-sm">
                        {feedback.correctCount} de {feedback.total} palavras
                      </p>
                    </div>

                    {/* Palavras coloridas */}
                    <div className="bg-white/5 rounded-lg p-4 leading-loose">
                      {feedback.diffResult.map((item, idx) => {
                        if (item.type === 'correct') {
                          return <span key={idx} className="text-[#22C55E] mr-1">{item.word}</span>
                        }
                        if (item.type === 'missing') {
                          return (
                            <span key={idx} className="text-[#EF4444]/50 mr-1 italic">
                              [{item.word}]
                            </span>
                          )
                        }
                        if (item.type === 'extra') {
                          return (
                            <span key={idx} className="text-[#EF4444] line-through mr-1 opacity-60">
                              {item.word}
                            </span>
                          )
                        }
                        // wrong
                        return (
                          <span key={idx} className="mr-1">
                            <span className="text-[#EF4444] line-through">{item.word}</span>
                            <span className="text-[#22C55E] ml-1">{item.expected}</span>
                          </span>
                        )
                      })}
                    </div>

                    {/* Legenda */}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
                      <span><span className="text-[#22C55E]">●</span> Correto</span>
                      <span><span className="text-[#EF4444]">●</span> Erro</span>
                      <span><span className="italic">[palavra]</span> Faltou</span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                      className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
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