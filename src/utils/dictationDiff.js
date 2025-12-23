// src/utils/dictationDiff.js

// ============================================
// ALGORITMO DE CORREÇÃO DE DITADO
// Wagner-Fischer (Edit Distance) + Semantic Expansion
// ============================================

// Mapa de contrações EXTENDIDO (A1-B2 coverage)
const CONTRACTIONS = {
  // --- Verbo TO BE / HAVE / WILL ---
  "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is",
  "we're": "we are", "they're": "they are", 
  "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have",
  "i'll": "i will", "you'll": "you will", "he'll": "he will", "she'll": "she will",
  "we'll": "we will", "they'll": "they will", "it'll": "it will",
  "i'd": "i would", "you'd": "you would", "he'd": "he would", "she'd": "she would",
  "we'd": "we would", "they'd": "they would",

  // --- Negativas ---
  "isn't": "is not", "aren't": "are not",
  "wasn't": "was not", "weren't": "were not",
  "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
  "won't": "will not", "shan't": "shall not",
  "can't": "can not", "cannot": "can not", "couldn't": "could not",
  "shouldn't": "should not", "wouldn't": "would not", "mustn't": "must not",
  
  // --- Questions/Relativas ---
  "that's": "that is", "what's": "what is", "let's": "let us",
  "who's": "who is", "where's": "where is", "there's": "there is",
  "here's": "here is", "how's": "how is",
  
  // --- Informal Oral ---
  "gonna": "going to", "wanna": "want to", "gotta": "got to", "lemme": "let me",

  // --- ERROS COMUNS (Sem apóstrofo) ---
  "im": "i am", "youre": "you are", "hes": "he is", "shes": "she is",
  "isnt": "is not", "arent": "are not", "wasnt": "was not", "werent": "were not",
  "dont": "do not", "doesnt": "does not", "didnt": "did not", "wont": "will not",
  "cant": "can not", "couldnt": "could not", "thats": "that is", "whats": "what is", 
  "lets": "let us", "ill": "i will", "youll": "you will", "ive": "i have"
}

// Números por extenso (0-20 agora, para cobrir mais casos básicos)
const NUMBER_WORDS = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
  '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
  '18': 'eighteen', '19': 'nineteen', '20': 'twenty'
}

const NUMBER_WORD_SET = new Set(Object.values(NUMBER_WORDS))

// Palavras que indicam cabeçalho (ignoradas)
const HEADER_TRIGGERS = new Set([
  'episode', 'chapter', 'unit', 'part', 'aula', 'licao', 'audio', 'track', 'episodio'
])

// Regex para remover caracteres invisíveis (zero-width space, etc)
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF]/g

/**
 * Normaliza e tokeniza texto para comparação
 */
export function normalizeAndTokenize(text) {
  if (!text) return []
  
  // 1. Converte para string e lowercase
  let clean = String(text).toLowerCase()
  
  // 2. Remove acentos
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  
  // 3. Normaliza apóstrofos (diversos tipos para o padrão ')
  clean = clean.replace(/[’‘‛`´]/g, "'")
  
  // 4. Converte números para extenso
  clean = clean.replace(/\b([0-9]|1[0-9]|20)\b/g, (match) => NUMBER_WORDS[match] || match)
  
  // 5. Remove caracteres invisíveis (vinda de copy/paste ou mobile)
  clean = clean.replace(INVISIBLE_CHARS, '')

  // 6. Remove pontuação (troca por espaço para separar palavras coladas)
  clean = clean.replace(/[^a-z0-9'\s]/g, ' ')
  
  // 7. Colapsa múltiplos espaços em um só e remove pontas
  clean = clean.replace(/\s+/g, ' ').trim()
  
  // 8. Tokeniza e expande contrações
  let tokens = clean ? clean.split(' ') : []
  let expandedTokens = []
  
  tokens.forEach(token => {
    // Limpa apóstrofos nas bordas
    const tokenClean = token.replace(/^'+|'+$/g, '')
    if (!tokenClean) return

    const tokenNoApostrophe = tokenClean.replace(/'/g, '')
    
    if (CONTRACTIONS[tokenClean]) {
      expandedTokens.push(...CONTRACTIONS[tokenClean].split(' '))
    } else if (CONTRACTIONS[tokenNoApostrophe]) {
      expandedTokens.push(...CONTRACTIONS[tokenNoApostrophe].split(' '))
    } else {
      expandedTokens.push(tokenNoApostrophe) // Mantém apóstrofo original se não for contração conhecida
    }
  })
  
  return expandedTokens
}

/**
 * Calcula diferença e score justo
 */
export function calculateDiff(originalText, userText, episodeTitle = "") {
  const origTokens = normalizeAndTokenize(originalText)
  const userTokens = normalizeAndTokenize(userText)
  const titleTokens = normalizeAndTokenize(episodeTitle)
  let startUserIndex = 0

  // 1. Ignora cabeçalhos
  while (startUserIndex < userTokens.length) {
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

  // 2. Ignora título
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

  // 3. Matriz de distâncias (Wagner-Fischer)
  const dp = Array(N + 1).fill(null).map(() => Array(M + 1).fill(0))

  for (let i = 0; i <= N; i++) dp[i][0] = i
  for (let j = 0; j <= M; j++) dp[0][j] = j

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (origTokens[i - 1] === actualUserTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // Deletar
          dp[i][j - 1],     // Inserir
          dp[i - 1][j - 1]  // Substituir
        )
      }
    }
  }

  // 4. Backtracking
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

  // 5. Adiciona cabeçalhos ignorados (visual)
  const headerDiffs = userTokens.slice(0, startUserIndex).map(w => ({ type: 'title', word: w }))
  const finalDiff = [...headerDiffs, ...diffResult]

  // 6. CÁLCULO DE SCORE JUSTO (v2)
  // Base: Acertos sobre o Total Original (ignora extras no denominador)
  const totalRelevant = origTokens.length > 0 ? origTokens.length : 1
  const accuracy = (correctCount / totalRelevant) * 100
  
  // Penalidade leve para extras (5% por palavra extra, máximo de zerar o score)
  const penalty = extraCount * 5
  
  // Score final não pode ser menor que 0 nem maior que 100
  const finalScore = Math.max(0, Math.min(100, accuracy - penalty))
  
  const score = Math.round(finalScore)

  return {
    diffResult: finalDiff,
    score,
    correctCount,
    total: origTokens.length,
    extraCount,
    missingCount,
    wrongCount
  }
}