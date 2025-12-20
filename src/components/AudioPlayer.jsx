import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONFIGURAÇÕES E UTILITÁRIOS ---

const CONTRACTIONS = {
  "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is",
  "we're": "we are", "they're": "they are", "isn't": "is not", "aren't": "are not",
  "wasn't": "was not", "weren't": "were not", "don't": "do not", "doesn't": "does not",
  "didn't": "did not", "won't": "will not", "can't": "can not", "cannot": "can not",
  "couldn't": "could not", "that's": "that is", "what's": "what is", "let's": "let us",
  "gonna": "going to", "wanna": "want to", "gotta": "got to",
  "im": "i am", "youre": "you are", "hes": "he is", "shes": "she is",
  "isnt": "is not", "arent": "are not", "wasnt": "was not", "werent": "were not",
  "dont": "do not", "doesnt": "does not", "didnt": "did not", "wont": "will not",
  "cant": "can not", "couldnt": "could not", "thats": "that is", "whats": "what is", "lets": "let us"
}

const NUMBER_WORDS = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve'
}

const NUMBER_WORD_SET = new Set(Object.values(NUMBER_WORDS))

const HEADER_TRIGGERS = new Set([
  'episode', 'chapter', 'unit', 'part', 'aula', 'licao', 'audio', 'track', 'episodio'
])

function normalizeAndTokenize(text) {
  if (!text) return []
  let clean = text.toLowerCase()
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  clean = clean.replace(/[’‘‛`´]/g, "'")
  clean = clean.replace(/\b([0-9]|1[0-2])\b/g, (match) => NUMBER_WORDS[match] || match)
  clean = clean.replace(/[^a-z0-9'\s]/g, ' ')
  let tokens = clean.split(/\s+/).filter(w => w)
  let expandedTokens = []
  tokens.forEach(token => {
    const tokenClean = token.replace(/^'+|'+$/g, '')
    const tokenNoApostrophe = tokenClean.replace(/'/g, '')
    if (CONTRACTIONS[tokenClean]) {
      expandedTokens.push(...CONTRACTIONS[tokenClean].split(' '))
    } else if (CONTRACTIONS[tokenNoApostrophe]) {
      expandedTokens.push(...CONTRACTIONS[tokenNoApostrophe].split(' '))
    } else {
      expandedTokens.push(tokenNoApostrophe)
    }
  })
  return expandedTokens
}

// --- ALGORITMO NUCLEAR (WAGNER-FISCHER) ---
// Substitui o calculateDiff antigo que "desistia" fácil
function calculateDiff(originalText, userText, episodeTitle = "") {
  const origTokens = normalizeAndTokenize(originalText)
  const userTokens = normalizeAndTokenize(userText)
  const titleTokens = normalizeAndTokenize(episodeTitle)
  let startUserIndex = 0

  // 1. Lógica de Cabeçalho
  while(startUserIndex < userTokens.length) {
    const word = userTokens[startUserIndex]
    if (HEADER_TRIGGERS.has(word)) {
       startUserIndex++
       if (startUserIndex < userTokens.length) {
         const nextWord = userTokens[startUserIndex]
         if (NUMBER_WORD_SET.has(nextWord) || /^\d+$/.test(nextWord)) {
            startUserIndex++
         }
       }
    } else {
      break
    }
  }

  // 2. Lógica de Título
  if (titleTokens.length > 0 && startUserIndex < userTokens.length) {
    let matchCount = 0
    for (let i = 0; i < titleTokens.length; i++) {
      if (startUserIndex + i < userTokens.length && userTokens[startUserIndex + i] === titleTokens[i]) {
        matchCount++
      } else {
        break
      }
    }
    const threshold = Math.ceil(titleTokens.length * 0.6)
    if (matchCount >= threshold) {
       const origStartsWithTitle = titleTokens.slice(0, matchCount).every((t, i) => origTokens[i] === t)
       if (!origStartsWithTitle) {
         startUserIndex += matchCount
       }
    }
  }

  const actualUserTokens = userTokens.slice(startUserIndex)
  const N = origTokens.length
  const M = actualUserTokens.length
  
  // Matriz de distâncias (A Mágica Matemática)
  const dp = Array(N + 1).fill(null).map(() => Array(M + 1).fill(0))

  for (let i = 0; i <= N; i++) dp[i][0] = i
  for (let j = 0; j <= M; j++) dp[0][j] = j

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (origTokens[i - 1] === actualUserTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // Deletar
          dp[i][j - 1],    // Inserir
          dp[i - 1][j - 1] // Substituir
        )
      }
    }
  }

  // Backtracking para gerar o diff visual
  let i = N
  let j = M
  const diffReverse = []
  let correctCount = 0
  let extraCount = 0
  let missingCount = 0
  let wrongCount = 0

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === actualUserTokens[j - 1]) {
      diffReverse.push({ type: 'correct', word: origTokens[i - 1] })
      correctCount++
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      diffReverse.push({ type: 'extra', word: actualUserTokens[j - 1] })
      extraCount++
      j--
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      diffReverse.push({ type: 'missing', word: origTokens[i - 1] })
      missingCount++
      i--
    } else {
      diffReverse.push({ type: 'wrong', word: actualUserTokens[j - 1], expected: origTokens[i - 1] })
      wrongCount++
      i--
      j--
    }
  }

  const diffResult = diffReverse.reverse()
  
  // Reconecta os tokens de cabeçalho ignorados visualmente
  const headerDiffs = userTokens.slice(0, startUserIndex).map(w => ({ type: 'title', word: w }))
  const finalDiff = [...headerDiffs, ...diffResult]

  const totalRelevant = origTokens.length + extraCount
  const rawScore = totalRelevant > 0 ? (correctCount / totalRelevant) * 100 : 0
  const score = Math.min(100, Math.round(rawScore))
  
  return { diffResult: finalDiff, score, correctCount, total: origTokens.length, extraCount, missingCount, wrongCount }
}

export default function AudioPlayer({ audioUrl, coverImage, episodeTitle, initialTime, onTimeUpdate, transcript, showQuiz, setShowQuiz }) {
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

  const handleCheck = () => {
    if (!userText.trim() || !transcript) return
    const result = calculateDiff(transcript, userText, episodeTitle)
    setFeedback(result)
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

      {/* Barra de progresso com Efeito Liquid Light */}
      <div className="mb-6">
        <div 
          className="h-2 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-2 rounded-full smooth-progress relative sexy-progress-bar bg-[#E50914]" 
            style={{ width: `${progress}%` }} 
          >
            {/* Bolinha na ponta */}
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
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
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

      {/* --- BOTÕES DE AÇÃO (PILLS) --- */}
      {/* Aqui a lógica é: Ditado abre dentro do player, Quiz toggle uma prop externa */}
      <div className="border-t border-white/10 pt-4 flex flex-wrap justify-center gap-3">
        
        {/* Botão 1: Praticar Escrita */}
        {transcript && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { 
              const newState = !showDictation
              setShowDictation(newState)
              if (newState) setFeedback(null)
              if (newState && showQuiz) setShowQuiz(false) // Fecha o quiz se abrir a escrita
            }}
            className={`w-fit px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 border ${showDictation ? 'bg-[#F59E0B] text-black border-[#F59E0B]' : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 hover:bg-[#F59E0B]/20'} shine-effect`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            {showDictation ? 'Fechar Ditado' : 'Praticar Escrita'}
          </motion.button>
        )}

        {/* Botão 2: Responder Quiz */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
             const newState = !showQuiz
             setShowQuiz(newState)
             if (newState && showDictation) setShowDictation(false) // Fecha a escrita se abrir o quiz
          }}
          className={`w-fit px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 border ${showQuiz ? 'bg-[#E50914] text-white border-[#E50914]' : 'bg-[#E50914]/10 text-[#E50914] border-[#E50914]/20 hover:bg-[#E50914]/20'} shine-effect`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {showQuiz ? 'Esconder Perguntas' : 'Responder Quiz'}
        </motion.button>
      </div>

      {/* ÁREA DE CONTEÚDO (Apenas Ditado, o Quiz é renderizado pelo pai) */}
      {transcript && (
        <AnimatePresence>
          {showDictation && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 text-left bg-white/5 rounded-xl overflow-hidden border border-white/5">
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
                      <div className="text-right flex flex-col items-end">
                         <div className="text-white text-sm"><span className="text-white/50 text-xs uppercase mr-2">Acertos</span>{feedback.correctCount} / {feedback.total}</div>
                         <div className="flex gap-2 text-[10px] text-white/50 mt-1">
                            {feedback.extraCount > 0 && <span>+ {feedback.extraCount} extras</span>}
                            {feedback.missingCount > 0 && <span>- {feedback.missingCount} faltas</span>}
                            {feedback.wrongCount > 0 && <span>• {feedback.wrongCount} erros</span>}
                         </div>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-4 leading-loose flex flex-wrap gap-1.5 break-words font-light text-base">
                      {feedback.diffResult.map((item, idx) => {
                        if (item.type === 'title') return <span key={idx} className="text-white/30 select-none mr-1.5 text-xs uppercase">{item.word}</span>
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
      )}
    </div>
  )
}