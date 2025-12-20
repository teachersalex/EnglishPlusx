// AudioPlayer.jsx
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONFIGURAÇÕES E UTILITÁRIOS ---

const CONTRACTIONS = {
  // Com apóstrofo (padrão)
  "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is",
  "we're": "we are", "they're": "they are", "isn't": "is not", "aren't": "are not",
  "wasn't": "was not", "weren't": "were not", "don't": "do not", "doesn't": "does not",
  "didn't": "did not", "won't": "will not", "can't": "can not", "cannot": "can not",
  "couldn't": "could not", "that's": "that is", "what's": "what is", "let's": "let us",
  "gonna": "going to", "wanna": "want to", "gotta": "got to",

  // Fallback sem apóstrofo (input mobile/preguiçoso)
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

// Palavras que ativam o modo "Ignorar Cabeçalho"
const HEADER_TRIGGERS = new Set([
  'episode', 'chapter', 'unit', 'part', 'aula', 'licao', 'audio', 'track', 'episodio'
])

function normalizeAndTokenize(text) {
  if (!text) return []

  let clean = text.toLowerCase()

  // 1) Remove acentos (NFD)
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, "")

  // 2) Normaliza aspas/apóstrofos
  clean = clean.replace(/[’‘‛`´]/g, "'")

  // 3) Converte números digitais isolados (0–12)
  clean = clean.replace(/\b([0-9]|1[0-2])\b/g, (match) => NUMBER_WORDS[match] || match)

  // 4) Limpeza: mantém letras, números, espaços e apóstrofo
  clean = clean.replace(/[^a-z0-9'\s]/g, ' ')

  const tokens = clean.split(/\s+/).filter(Boolean)
  const expandedTokens = []

  for (const token of tokens) {
    // remove apóstrofos nas pontas
    const tokenClean = token.replace(/^'+|'+$/g, '')
    const tokenNoApostrophe = tokenClean.replace(/'/g, '')

    if (CONTRACTIONS[tokenClean]) {
      expandedTokens.push(...CONTRACTIONS[tokenClean].split(' '))
    } else if (CONTRACTIONS[tokenNoApostrophe]) {
      expandedTokens.push(...CONTRACTIONS[tokenNoApostrophe].split(' '))
    } else {
      expandedTokens.push(tokenNoApostrophe)
    }
  }

  return expandedTokens
}

// --- ALGORITMO ROBUSTO (EDIT DISTANCE + PARENTS DETERMINÍSTICO) ---
function calculateDiff(originalText, userText, episodeTitle = "") {
  const origTokens = normalizeAndTokenize(originalText)
  const userTokens = normalizeAndTokenize(userText)
  const titleTokens = normalizeAndTokenize(episodeTitle)

  let startUserIndex = 0

  // 1) Lógica de Cabeçalho (ignora "episode 1", "chapter two", etc.)
  while (startUserIndex < userTokens.length) {
    const w = userTokens[startUserIndex]
    if (HEADER_TRIGGERS.has(w)) {
      startUserIndex++
      if (startUserIndex < userTokens.length) {
        const next = userTokens[startUserIndex]
        if (NUMBER_WORD_SET.has(next) || /^\d+$/.test(next)) startUserIndex++
      }
    } else {
      break
    }
  }

  // 2) Lógica de Título (se o aluno colou o título no começo)
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
      const origStartsWithTitle = titleTokens
        .slice(0, matchCount)
        .every((t, i) => origTokens[i] === t)

      if (!origStartsWithTitle) startUserIndex += matchCount
    }
  }

  // Tokens "reais" do aluno (pós-cabeçalho/título)
  const actualUserTokens = userTokens.slice(startUserIndex)

  const N = origTokens.length
  const M = actualUserTokens.length

  // Guard rail (evita travar em textos enormes)
  const MAX_CELLS = 2_000_000 // ajuste se quiser
  if ((N + 1) * (M + 1) > MAX_CELLS) {
    // fallback simples: compara posição a posição até o menor tamanho
    const minLen = Math.min(N, M)
    const diff = []

    let correctCount = 0
    let wrongCount = 0

    for (let k = 0; k < minLen; k++) {
      if (origTokens[k] === actualUserTokens[k]) {
        diff.push({ type: 'correct', word: origTokens[k] })
        correctCount++
      } else {
        diff.push({ type: 'wrong', word: actualUserTokens[k], expected: origTokens[k] })
        wrongCount++
      }
    }

    const extraCount = M > N ? (M - N) : 0
    const missingCount = N > M ? (N - M) : 0

    for (let k = minLen; k < N; k++) diff.push({ type: 'missing', word: origTokens[k] })
    for (let k = minLen; k < M; k++) diff.push({ type: 'extra', word: actualUserTokens[k] })

    const headerDiffs = userTokens.slice(0, startUserIndex).map(w => ({ type: 'title', word: w }))
    const finalDiff = [...headerDiffs, ...diff]

    const totalRelevant = N + extraCount
    const rawScore = totalRelevant > 0 ? (correctCount / totalRelevant) * 100 : 0
    const score = Math.min(100, Math.round(rawScore))

    return { diffResult: finalDiff, score, correctCount, total: N, extraCount, missingCount, wrongCount }
  }

  // dp + parent (parent determinístico evita “empates ruins”)
  const dp = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0))
  const parent = Array.from({ length: N + 1 }, () => Array(M + 1).fill(null))
  // parent: 'DIAG' (match/replace), 'UP' (delete/missing), 'LEFT' (insert/extra)

  // init
  dp[0][0] = 0
  parent[0][0] = null
  for (let i = 1; i <= N; i++) {
    dp[i][0] = i
    parent[i][0] = 'UP'
  }
  for (let j = 1; j <= M; j++) {
    dp[0][j] = j
    parent[0][j] = 'LEFT'
  }

  // fill
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      const same = origTokens[i - 1] === actualUserTokens[j - 1]
      const diag = dp[i - 1][j - 1] + (same ? 0 : 1) // match/replace
      const up = dp[i - 1][j] + 1                    // delete (missing)
      const left = dp[i][j - 1] + 1                  // insert (extra)

      // escolhe mínimo com tie-break: DIAG > UP > LEFT
      let best = diag
      let move = 'DIAG'

      if (up < best) { best = up; move = 'UP' }
      // se empatar com DIAG, mantém DIAG (não troca)
      if (left < best) { best = left; move = 'LEFT' }
      // se empatar, mantém o move atual (DIAG/UP tem preferência)

      dp[i][j] = best
      parent[i][j] = move
    }
  }

  // backtrack
  let i = N
  let j = M
  const diffReverse = []

  let correctCount = 0
  let extraCount = 0
  let missingCount = 0
  let wrongCount = 0

  while (i > 0 || j > 0) {
    const move = parent[i][j]

    if (move === 'DIAG') {
      const a = origTokens[i - 1]
      const b = actualUserTokens[j - 1]
      if (a === b) {
        diffReverse.push({ type: 'correct', word: a })
        correctCount++
      } else {
        diffReverse.push({ type: 'wrong', word: b, expected: a })
        wrongCount++
      }
      i--; j--;
      continue
    }

    if (move === 'UP') {
      diffReverse.push({ type: 'missing', word: origTokens[i - 1] })
      missingCount++
      i--
      continue
    }

    // LEFT (ou null se algo muito raro acontecer)
    diffReverse.push({ type: 'extra', word: actualUserTokens[j - 1] })
    extraCount++
    j--
  }

  const diffResult = diffReverse.reverse()

  // Adiciona de volta os tokens de cabeçalho (apenas visuais) no início
  const headerDiffs = userTokens.slice(0, startUserIndex).map(w => ({ type: 'title', word: w }))
  const finalDiff = [...headerDiffs, ...diffResult]

  // Score (penaliza extras porque “encheção” não é acerto)
  const totalRelevant = N + extraCount
  const rawScore = totalRelevant > 0 ? (correctCount / totalRelevant) * 100 : 0
  const score = Math.min(100, Math.round(rawScore))

  return { diffResult: finalDiff, score, correctCount, total: N, extraCount, missingCount, wrongCount }
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
    if (audioRef.current) audioRef.current.playbackRate = speed
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (audioRef.current) audioRef.current.currentTime = percent * duration
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

      {/* Capa */}
      <div className="mb-6">
        <img
          src={coverImage}
          alt={episodeTitle}
          className="w-full h-48 object-cover rounded-xl shadow-lg"
        />
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

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(-5)}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20"
        >
          -5s
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#B20710]"
        >
          {isPlaying ? (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => skip(5)}
          className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-white/20"
        >
          +5s
        </motion.button>
      </div>

      {/* Velocidades */}
      <div className="flex items-center justify-center gap-2">
        {speeds.map((speed) => (
          <motion.button
            key={speed}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeSpeed(speed)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${playbackRate === speed
              ? 'bg-[#E50914] text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>

      {/* UX */}
      {transcript && (
        <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const newState = !showDictation
              setShowDictation(newState)
              if (newState) setFeedback(null)
            }}
            className="w-full py-3 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 rounded-xl text-[#F59E0B] font-medium transition-colors flex items-center justify-center gap-2 border border-[#F59E0B]/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {showDictation ? 'Fechar Ditado' : 'Praticar Escrita'}
          </motion.button>

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
                    <p className="text-white/70 text-sm mb-3">Ouça e escreva:</p>

                    <textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="Digite aqui..."
                      className="w-full h-32 p-3 rounded-lg bg-black/30 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#F59E0B] border border-white/10 leading-relaxed font-light"
                    />

                    <div className="flex gap-2 mt-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCheck}
                        disabled={!userText.trim()}
                        className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-white font-bold transition-colors shadow-lg"
                      >
                        Verificar
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReset}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium"
                      >
                        Limpar
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                      <div>
                        <span className="text-white/50 text-xs uppercase tracking-wider">Pontuação</span>
                        <div className={`text-2xl font-bold ${feedback.score >= 90 ? 'text-green-400' : feedback.score >= 70 ? 'text-yellow-400' : 'text-white/60'}`}>
                          {feedback.score}%
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <div className="text-white text-sm">
                          <span className="text-white/50 text-xs uppercase mr-2">Acertos</span>
                          {feedback.correctCount} / {feedback.total}
                        </div>

                        <div className="flex gap-2 text-[10px] text-white/50 mt-1">
                          {feedback.extraCount > 0 && <span>+ {feedback.extraCount} extras</span>}
                          {feedback.missingCount > 0 && <span>- {feedback.missingCount} faltas</span>}
                          {feedback.wrongCount > 0 && <span>• {feedback.wrongCount} erros</span>}
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-4 leading-loose flex flex-wrap gap-1.5 break-words font-light text-base">
                      {feedback.diffResult.map((item, idx) => {
                        if (item.type === 'title') {
                          return (
                            <span key={idx} className="text-white/30 select-none mr-1.5 text-xs uppercase">
                              {item.word}
                            </span>
                          )
                        }

                        if (item.type === 'correct') {
                          return <span key={idx} className="text-white/90">{item.word}</span>
                        }

                        if (item.type === 'missing') {
                          return (
                            <span
                              key={idx}
                              className="text-yellow-500/80 border-b border-yellow-500/50 border-dashed"
                              title="Faltou"
                            >
                              {item.word}
                            </span>
                          )
                        }

                        if (item.type === 'extra') {
                          return (
                            <span
                              key={idx}
                              className="text-white/20 line-through text-sm decoration-white/10 select-none"
                            >
                              {item.word}
                            </span>
                          )
                        }

                        // wrong
                        return (
                          <span key={idx} className="inline-flex flex-wrap items-baseline gap-1">
                            <span className="text-red-400/60 line-through text-sm decoration-red-400/30">
                              {item.word}
                            </span>
                            <span className="text-green-400 font-medium">
                              {item.expected}
                            </span>
                          </span>
                        )
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/40 justify-center border-t border-white/5 pt-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/90"></span> Correto
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400/60"></span> Erro
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span> Correção
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span> Faltou
                      </span>
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
