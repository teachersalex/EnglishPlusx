import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ==========================================
// 1. O CORAÇÃO NUCLEAR (LÓGICA DE CORREÇÃO)
// ==========================================

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

const NUMBER_WORDS = { '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '11': 'eleven', '12': 'twelve' }
const HEADER_TRIGGERS = new Set(['episode', 'chapter', 'unit', 'part', 'aula', 'licao', 'audio', 'track', 'episodio'])
const NUMBER_WORD_SET = new Set(Object.values(NUMBER_WORDS))

function normalizeAndTokenize(text) {
  if (!text) return []
  let clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[’‘‛`´]/g, "'").replace(/\b([0-9]|1[0-2])\b/g, (match) => NUMBER_WORDS[match] || match).replace(/[^a-z0-9'\s]/g, ' ')
  let tokens = clean.split(/\s+/).filter(w => w)
  let expandedTokens = []
  tokens.forEach(token => {
    const tokenClean = token.replace(/^'+|'+$/g, '')
    const tokenNoApostrophe = tokenClean.replace(/'/g, '')
    if (CONTRACTIONS[tokenClean]) expandedTokens.push(...CONTRACTIONS[tokenClean].split(' '))
    else if (CONTRACTIONS[tokenNoApostrophe]) expandedTokens.push(...CONTRACTIONS[tokenNoApostrophe].split(' '))
    else expandedTokens.push(tokenNoApostrophe)
  })
  return expandedTokens
}

// Algoritmo Wagner-Fischer (Nuclear)
function calculateDiff(originalText, userText, episodeTitle = "") {
  const origTokens = normalizeAndTokenize(originalText)
  const userTokens = normalizeAndTokenize(userText)
  const titleTokens = normalizeAndTokenize(episodeTitle)
  let startUserIndex = 0

  while(startUserIndex < userTokens.length) {
    const word = userTokens[startUserIndex]
    if (HEADER_TRIGGERS.has(word)) {
       startUserIndex++
       if (startUserIndex < userTokens.length && (NUMBER_WORD_SET.has(userTokens[startUserIndex]) || /^\d+$/.test(userTokens[startUserIndex]))) startUserIndex++
    } else break
  }
  if (titleTokens.length > 0 && startUserIndex < userTokens.length) {
    let matchCount = 0
    for (let i = 0; i < titleTokens.length; i++) {
      if (startUserIndex + i < userTokens.length && userTokens[startUserIndex + i] === titleTokens[i]) matchCount++
      else break
    }
    if (matchCount >= Math.ceil(titleTokens.length * 0.6)) startUserIndex += matchCount
  }

  const actualUserTokens = userTokens.slice(startUserIndex)
  const N = origTokens.length
  const M = actualUserTokens.length
  const dp = Array(N + 1).fill(null).map(() => Array(M + 1).fill(0))

  for (let i = 0; i <= N; i++) dp[i][0] = i
  for (let j = 0; j <= M; j++) dp[0][j] = j

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (origTokens[i - 1] === actualUserTokens[j - 1]) dp[i][j] = dp[i - 1][j - 1]
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  let i = N, j = M
  const diffReverse = []
  let correctCount = 0, extraCount = 0, missingCount = 0, wrongCount = 0

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === actualUserTokens[j - 1]) {
      diffReverse.push({ type: 'correct', word: origTokens[i - 1] }); correctCount++; i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      diffReverse.push({ type: 'extra', word: actualUserTokens[j - 1] }); extraCount++; j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      diffReverse.push({ type: 'missing', word: origTokens[i - 1] }); missingCount++; i--;
    } else {
      diffReverse.push({ type: 'wrong', word: actualUserTokens[j - 1], expected: origTokens[i - 1] }); wrongCount++; i--; j--;
    }
  }

  const diffResult = [...userTokens.slice(0, startUserIndex).map(w => ({ type: 'title', word: w })), ...diffReverse.reverse()]
  const totalRelevant = origTokens.length + extraCount
  const score = totalRelevant > 0 ? Math.round((correctCount / totalRelevant) * 100) : 0
  return { diffResult, score, correctCount, total: origTokens.length, extraCount, missingCount, wrongCount }
}

// ==========================================
// 2. O COMPONENTE (INTERFACE)
// ==========================================

export default function AudioPlayer({ audioUrl, coverImage, episodeTitle, initialTime, onTimeUpdate, transcript, quizData }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  // ESTADO DAS ABAS (As Pills que você queria)
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
      if (initialTime && initialTime > 0 && Math.abs(audio.currentTime - initialTime) > 1) {
          audio.currentTime = initialTime
      }
    }
    audio.addEventListener('loadedmetadata', handleLoaded)
    return () => audio.removeEventListener('loadedmetadata', handleLoaded)
  }, [initialTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => { setIsPlaying(false); if (onTimeUpdate) onTimeUpdate(audio.currentTime); }
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)
    return () => { audio.removeEventListener('timeupdate', updateTime); audio.removeEventListener('ended', handleEnded); }
  }, [onTimeUpdate])

  useEffect(() => {
    if (!onTimeUpdate) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) onTimeUpdate(audioRef.current.currentTime)
    }, 5000)
    return () => clearInterval(interval)
  }, [onTimeUpdate])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false); onTimeUpdate(audio.currentTime); }
    else { await audio.play(); setIsPlaying(true); }
  }

  const skip = (seconds) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration)
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

  const progress = duration ? (currentTime / duration) * 100 : 0
  const formatTime = (t) => {
    if(isNaN(t)) return "0:00"
    return `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,'0')}`
  }

  return (
    <div className="bg-[#1A1A1A] rounded-3xl p-6 shadow-2xl overflow-hidden border border-white/5 relative transition-all duration-300">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* --- PARTE SUPERIOR: PLAYER + GLOW --- */}
      <div className="flex flex-col items-center mb-6">
        <div className={`w-40 h-40 rounded-2xl shadow-xl overflow-hidden mb-4 ${isPlaying ? 'breathing-cover' : ''}`}>
          <img src={coverImage} alt={episodeTitle} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-white font-bold text-lg text-center leading-tight">{episodeTitle}</h2>
      </div>

      {/* Barra de Progresso "Sexy" */}
      <div className="mb-4 group">
        <div className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden relative" onClick={handleProgressClick}>
          <div className="h-full sexy-progress-bar rounded-full relative" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-white/40 font-mono">
          <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <motion.button whileTap={{scale:0.9}} onClick={() => skip(-10)} className="text-white/70 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg></motion.button>
        <motion.button whileTap={{scale:0.95}} onClick={togglePlay} className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#ff1f2c] transition-colors btn-shine">
          {isPlaying ? <svg className="w-8 h-8 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
        </motion.button>
        <motion.button whileTap={{scale:0.9}} onClick={() => skip(10)} className="text-white/70 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 8c4.65 0 8.58 3.03 9.96 7.22L17.6 16c-1.05-3.19-4.05-5.5-7.6-5.5-1.95 0-3.73.72-5.12 1.88L1.24 16H10v-9z"/></svg></motion.button>
      </div>

      {/* --- AS PILLS (ABAS DE SELEÇÃO) --- */}
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

      {/* --- ÁREA DE CONTEÚDO --- */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          
          {/* 1. CONTEÚDO DITADO */}
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
                      <div><span className="text-white/40 text-xs tracking-wider uppercase">Pontuação</span><div className={`text-3xl font-bold ${feedback.score >= 90 ? 'text-green-400' : feedback.score >= 60 ? 'text-yellow-400' : 'text-white/60'}`}>{feedback.score}%</div></div>
                      <button onClick={handleReset} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold text-white hover:bg-white/20">Tentar de Novo</button>
                    </div>
                    <div className="bg-black/40 rounded-xl p-4 leading-loose font-light text-base text-white/90">
                       {feedback.diffResult.map((item, idx) => {
                        if (item.type === 'title') return <span key={idx} className="text-white/30 text-xs uppercase mr-2 select-none">{item.word}</span>
                        if (item.type === 'correct') return <span key={idx} className="mr-1">{item.word}</span>
                        if (item.type === 'missing') return <span key={idx} className="text-yellow-500/80 mr-1 border-b border-yellow-500/50 border-dashed" title="Faltou">{item.word}</span>
                        if (item.type === 'extra') return <span key={idx} className="text-white/20 line-through text-sm mr-1 decoration-white/10 select-none">{item.word}</span>
                        return <span key={idx} className="mr-1 inline-flex flex-col relative group"><span className="text-red-400/80 line-through text-sm decoration-red-400/30">{item.word}</span><span className="text-green-400 text-xs absolute -top-4 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 rounded">{item.expected}</span></span>
                      })}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/40 justify-center border-t border-white/5 pt-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/90"></span> Correto</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400/60"></span> Erro</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500/80"></span> Faltou</span>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleReset} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors">Tentar Novamente</motion.button>
                  </div>
                )}
            </motion.div>
          ) : (
            /* 2. CONTEÚDO QUIZ */
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
               {quizData ? (
                 <div className="space-y-4">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-white/40 text-xs font-bold">PERGUNTA {quizData.currentQuestionIndex + 1} / {quizData.totalQuestions}</span>
                     <div className="flex gap-1">
                        {Array.from({length: quizData.totalQuestions}).map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= quizData.currentQuestionIndex ? 'bg-[#E50914]' : 'bg-white/10'}`} />
                        ))}
                     </div>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-6">{quizData.currentQuestion.question}</h3>
                   <div className="space-y-3">
                      {quizData.currentQuestion.options.map((option, index) => {
                        const isSelected = quizData.selectedAnswer === index;
                        const showResult = quizData.selectedAnswer !== null;
                        const isCorrect = index === quizData.currentQuestion.correctAnswer;
                        
                        let style = "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10";
                        if (showResult) {
                          if (isSelected && quizData.lastAnswerCorrect) style = "bg-green-500/20 border-green-500 text-green-100";
                          else if (isSelected && !quizData.lastAnswerCorrect) style = "bg-red-500/20 border-red-500 text-red-100";
                          else if (isCorrect && !quizData.lastAnswerCorrect) style = "bg-white/5 border-green-500/50 text-green-100 opacity-60";
                          else style = "opacity-30";
                        }
                        
                        return (
                          <button
                            key={index}
                            disabled={showResult}
                            onClick={() => quizData.handleAnswer(index)}
                            className={`w-full p-4 rounded-xl text-left transition-all ${style} flex justify-between items-center`}
                          >
                            {option}
                            {showResult && isSelected && (quizData.lastAnswerCorrect ? '✅' : '❌')}
                          </button>
                        )
                      })}
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-40 text-white/50">
                    <p>Carregando quiz...</p>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}