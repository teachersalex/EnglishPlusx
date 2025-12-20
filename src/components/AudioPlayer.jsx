import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ==========================================
// 1. CONFIGURAÇÕES E UTILITÁRIOS (LÓGICA)
// ==========================================

const CONTRACTIONS = {
  // Padrão (com apóstrofo)
  "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is",
  "we're": "we are", "they're": "they are", "isn't": "is not", "aren't": "are not",
  "wasn't": "was not", "weren't": "were not", "don't": "do not", "doesn't": "does not",
  "didn't": "did not", "won't": "will not", "can't": "can not", "cannot": "can not",
  "couldn't": "could not", "that's": "that is", "what's": "what is", "let's": "let us",
  "gonna": "going to", "wanna": "want to", "gotta": "got to",
  
  // Fallback sem apóstrofo (para input mobile/preguiçoso)
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
  
  // 1. Remove acentos (NFD)
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  
  // 2. Normaliza aspas/apóstrofos
  clean = clean.replace(/[’‘‛`´]/g, "'")

  // 3. Converte números digitais isolados
  clean = clean.replace(/\b([0-9]|1[0-2])\b/g, (match) => NUMBER_WORDS[match] || match)

  // 4. Limpeza: Mantém letras, números, espaços E APÓSTROFOS
  clean = clean.replace(/[^a-z0-9'\s]/g, ' ')
  
  let tokens = clean.split(/\s+/).filter(w => w)
  let expandedTokens = []

  tokens.forEach(token => {
    // Tenta expandir com e sem apóstrofo
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

// --- ALGORITMO NUCLEAR (WAGNER-FISCHER / EDIT DISTANCE) ---
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

  // Tokens "reais" do aluno (pós-cabeçalho)
  const actualUserTokens = userTokens.slice(startUserIndex)
  
  const N = origTokens.length
  const M = actualUserTokens.length
  
  // Matriz de distâncias (DP Table)
  const dp = Array(N + 1).fill(null).map(() => Array(M + 1).fill(0))

  // Inicialização
  for (let i = 0; i <= N; i++) dp[i][0] = i // Custo de deletar tudo
  for (let j = 0; j <= M; j++) dp[0][j] = j // Custo de inserir tudo

  // Preenchimento da Matriz
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (origTokens[i - 1] === actualUserTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] // Match! Custo não aumenta
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // Deletar (Faltou)
          dp[i][j - 1],    // Inserir (Extra)
          dp[i - 1][j - 1] // Substituir (Erro)
        )
      }
    }
  }

  // Backtracking para reconstruir o caminho (Diff)
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

  // Inverte o array pois foi montado de trás pra frente
  const diffResultCore = diffReverse.reverse()

  // Adiciona cabeçalhos ignorados como "title"
  const headerDiffs = userTokens.slice(0, startUserIndex).map(w => ({ type: 'title', word: w }))
  const finalDiff = [...headerDiffs, ...diffResultCore]

  const totalRelevant = origTokens.length + extraCount
  const rawScore = totalRelevant > 0 ? (correctCount / totalRelevant) * 100 : 0
  const score = Math.min(100, Math.round(rawScore))
  
  return { diffResult: finalDiff, score, correctCount, total: origTokens.length, extraCount, missingCount, wrongCount }
}

// ==========================================
// 2. COMPONENTE VISUAL (UI + PILLS)
// ==========================================

export default function AudioPlayer({ audioUrl, coverImage, episodeTitle, initialTime, onTimeUpdate, transcript, quizData }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  // ESTADO DAS PILLS (ABAS)
  const [activeTab, setActiveTab] = useState('dictation')
  
  // ESTADO DO DITADO
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState(null)
  
  const speeds = [0.8, 1, 1.2, 1.5]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleLoaded = () => {
      setDuration(audio.duration)
      // Pequeno fix: se o tempo inicial for muito próximo do fim (completado), volta pro inicio
      if (initialTime && initialTime > 0) {
         if (Math.abs(audio.duration - initialTime) < 2) {
            audio.currentTime = 0
         } else {
            audio.currentTime = initialTime
         }
      }
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

  // Auto-save
  useEffect(() => {
    if (!onTimeUpdate) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        onTimeUpdate(audioRef.current.currentTime)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [onTimeUpdate])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
        if (onTimeUpdate) onTimeUpdate(audio.currentTime)
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

  const handleCheckDictation = () => {
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
    <div className="bg-[#1A1A1A] rounded-3xl p-6 shadow-2xl overflow-hidden border border-white/5 relative transition-all duration-300">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* --- BLOCO 1: PLAYER (FIXO) --- */}
      <div className="flex flex-col items-center mb-6">
        {/* Capa com efeito Breathing se estiver tocando */}
        <div className={`w-40 h-40 rounded-2xl shadow-xl overflow-hidden mb-4 ${isPlaying ? 'breathing-cover' : ''}`}>
          <img src={coverImage} alt={episodeTitle} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-white font-bold text-lg text-center leading-tight">{episodeTitle}</h2>
      </div>

      {/* Barra de Progresso "Sexy" */}
      <div className="mb-4 group">
        <div 
          className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden relative"
          onClick={handleProgressClick}
        >
          <div className="h-full sexy-progress-bar rounded-full relative" style={{ width: `${progress}%` }}>
            {/* Brilho na ponta */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-white/40 font-mono">
          <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles Principais */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(-10)} className="text-white/70 hover:text-white">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
        </motion.button>
        
        <motion.button whileTap={{ scale: 0.95 }} onClick={togglePlay} className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#ff1f2c] transition-colors btn-shine">
          {isPlaying ? (
            <svg className="w-8 h-8 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </motion.button>
        
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(10)} className="text-white/70 hover:text-white">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 8c4.65 0 8.58 3.03 9.96 7.22L17.6 16c-1.05-3.19-4.05-5.5-7.6-5.5-1.95 0-3.73.72-5.12 1.88L1.24 16H10v-9z"/></svg>
        </motion.button>
      </div>

      {/* --- BLOCO 2: PILLS (ABAS DE NAVEGAÇÃO) --- */}
      <div className="flex bg-black/30 p-1 rounded-xl mb-6 relative">
        {/* Fundo Animado da Aba Ativa */}
        <motion.div 
          className="absolute top-1 bottom-1 bg-white/10 rounded-lg shadow-sm"
          initial={false}
          animate={{
            left: activeTab === 'dictation' ? '4px' : '50%',
            width: 'calc(50% - 4px)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        <button 
          onClick={() => setActiveTab('dictation')} 
          className={`flex-1 py-2 text-sm font-bold rounded-lg relative z-10 transition-colors ${activeTab === 'dictation' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          📝 Ditado
        </button>
        <button 
          onClick={() => setActiveTab('quiz')} 
          className={`flex-1 py-2 text-sm font-bold rounded-lg relative z-10 transition-colors ${activeTab === 'quiz' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          🧠 Quiz
        </button>
      </div>

      {/* --- BLOCO 3: ÁREA DE CONTEÚDO (DITADO OU QUIZ) --- */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          
          {/* 3.1 CONTEÚDO DITADO */}
          {activeTab === 'dictation' ? (
            <motion.div 
              key="dictation"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
               {!feedback ? (
                  <div>
                    <textarea
                      value={userText} onChange={(e) => setUserText(e.target.value)}
                      placeholder="Escute o áudio e escreva aqui..."
                      className="w-full h-40 p-4 rounded-xl bg-black/40 text-white placeholder-white/30 text-base resize-none focus:outline-none focus:ring-1 focus:ring-[#E50914]/50 border border-white/5 font-light leading-relaxed"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        {speeds.map(s => (
                          <button key={s} onClick={()=>{setPlaybackRate(s); if(audioRef.current) audioRef.current.playbackRate = s}} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${playbackRate===s ? 'bg-white text-black' : 'bg-white/5 text-white/50'}`}>{s}x</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleReset} className="px-4 py-2 text-sm text-white/60 hover:text-white">Limpar</button>
                        <button onClick={handleCheckDictation} disabled={!userText.trim()} className="px-6 py-2 bg-[#E50914] text-white rounded-lg font-bold shadow-lg hover:bg-[#ff1f2c] disabled:opacity-50 btn-shine text-sm">Verificar</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                      <div>
                        <span className="text-white/40 text-xs tracking-wider uppercase">Pontuação</span>
                        <div className={`text-3xl font-bold ${feedback.score >= 90 ? 'text-green-400' : feedback.score >= 60 ? 'text-yellow-400' : 'text-white/60'}`}>{feedback.score}%</div>
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

                    <div className="bg-black/40 rounded-xl p-4 leading-loose font-light text-base text-white/90">
                       {feedback.diffResult.map((item, idx) => {
                        if (item.type === 'title') return <span key={idx} className="text-white/30 select-none mr-1.5 text-xs uppercase">{item.word}</span>
                        if (item.type === 'correct') return <span key={idx} className="mr-1">{item.word}</span>
                        if (item.type === 'missing') return <span key={idx} className="text-yellow-500/80 mr-1 border-b border-yellow-500/50 border-dashed" title="Faltou">{item.word}</span>
                        if (item.type === 'extra') return <span key={idx} className="text-white/20 line-through text-sm mr-1 decoration-white/10 select-none">{item.word}</span>
                        return (
                          <span key={idx} className="mr-1 inline-flex flex-col relative group">
                            <span className="text-red-400/80 line-through text-sm decoration-red-400/30">{item.word}</span>
                            <span className="text-green-400 text-xs absolute -top-4 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 rounded whitespace-nowrap z-10 border border-white/10">{item.expected}</span>
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
          ) : (
            /* 3.2 CONTEÚDO QUIZ */
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
               {quizData ? (
                 <div className="space-y-4">
                   {/* Header do Quiz */}
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Pergunta {quizData.currentQuestionIndex + 1} / {quizData.totalQuestions}</span>
                     <div className="flex gap-1">
                        {Array.from({length: quizData.totalQuestions}).map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= quizData.currentQuestionIndex ? 'bg-[#E50914]' : 'bg-white/10'}`} />
                        ))}
                     </div>
                   </div>

                   {/* Pergunta */}
                   <h3 className="text-xl font-bold text-white mb-6 leading-relaxed">{quizData.currentQuestion.question}</h3>

                   {/* Opções */}
                   <div className="space-y-3">
                      {quizData.currentQuestion.options.map((option, index) => {
                        const isSelected = quizData.selectedAnswer === index;
                        const showResult = quizData.selectedAnswer !== null;
                        const isCorrect = index === quizData.currentQuestion.correctAnswer;
                        
                        // Estilo Dinâmico
                        let style = "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/30";
                        if (showResult) {
                          if (isSelected && quizData.lastAnswerCorrect) {
                             style = "bg-green-500/20 border-green-500 text-green-100 ring-1 ring-green-500/50";
                          } else if (isSelected && !quizData.lastAnswerCorrect) {
                             style = "bg-red-500/20 border-red-500 text-red-100 ring-1 ring-red-500/50";
                          } else if (isCorrect && !quizData.lastAnswerCorrect) {
                             style = "bg-white/5 border-green-500/50 text-green-100 opacity-60"; // Mostra a correta se errou
                          } else {
                             style = "opacity-30 pointer-events-none"; // Apaga as irrelevantes
                          }
                        }
                        
                        return (
                          <button
                            key={index}
                            disabled={showResult}
                            onClick={() => quizData.handleAnswer(index)}
                            className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex justify-between items-center ${style}`}
                          >
                            <span>{option}</span>
                            {showResult && isSelected && (
                               <span>{quizData.lastAnswerCorrect ? '✅' : '❌'}</span>
                            )}
                          </button>
                        )
                      })}
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-40 text-white/50">
                    <p>O Quiz está carregando...</p>
                    <span className="text-xs mt-2 opacity-50">(Verifique se EpisodePage está enviando quizData)</span>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}