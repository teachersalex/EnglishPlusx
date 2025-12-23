// src/utils/dictationDiff.js

// ============================================
// ALGORITMO DE CORREÇÃO DE DITADO
// Wagner-Fischer (Edit Distance)
// ============================================

// Mapa de contrações para expansão
const CONTRACTIONS = {
  // Com apóstrofo
  "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is",
  "we're": "we are", "they're": "they are", "isn't": "is not", "aren't": "are not",
  "wasn't": "was not", "weren't": "were not", "don't": "do not", "doesn't": "does not",
  "didn't": "did not", "won't": "will not", "can't": "can not", "cannot": "can not",
  "couldn't": "could not", "that's": "that is", "what's": "what is", "let's": "let us",
  "gonna": "going to", "wanna": "want to", "gotta": "got to",
  // Sem apóstrofo (aluno digita errado)
  "im": "i am", "youre": "you are", "hes": "he is", "shes": "she is",
  "isnt": "is not", "arent": "are not", "wasnt": "was not", "werent": "were not",
  "dont": "do not", "doesnt": "does not", "didnt": "did not", "wont": "will not",
  "cant": "can not", "couldnt": "could not", "thats": "that is", "whats": "what is", "lets": "let us"
}

// Números por extenso (0-12)
const NUMBER_WORDS = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve'
}

const NUMBER_WORD_SET = new Set(Object.values(NUMBER_WORDS))

// Palavras que indicam cabeçalho (ignoradas)
const HEADER_TRIGGERS = new Set([
  'episode', 'chapter', 'unit', 'part', 'aula', 'licao', 'audio', 'track', 'episodio'
])

// [NOVO] Regex para remover caracteres invisíveis (zero-width space, etc)
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF]/g

/**
 * Normaliza e tokeniza texto para comparação
 * - Lowercase
 * - Remove acentos
 * - Converte números para extenso
 * - Remove pontuação
 * - Expande contrações
 * - [FIX] Sanitiza espaços duplicados e caracteres invisíveis
 */
export function normalizeAndTokenize(text) {
  if (!text) return []
  
  // 1. Converte para string e lowercase
  let clean = String(text).toLowerCase()
  
  // 2. Remove acentos
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  
  // 3. Normaliza apóstrofos (diversos tipos para o padrão ')
  clean = clean.replace(/[’‘‛`´]/g, "'")
  
  // 4. Converte números 0-12 para extenso
  clean = clean.replace(/\b([0-9]|1[0-2])\b/g, (match) => NUMBER_WORDS[match] || match)
  
  // 5. [FIX CRÍTICO] Remove caracteres invisíveis (vinda de copy/paste ou mobile)
  clean = clean.replace(INVISIBLE_CHARS, '')

  // 6. Remove pontuação (troca por espaço para separar palavras coladas)
  // Mantém apenas letras, números e apóstrofos
  clean = clean.replace(/[^a-z0-9'\s]/g, ' ')
  
  // 7. [FIX CRÍTICO] Colapsa múltiplos espaços em um só e remove pontas
  // Transforma "hello   world" em "hello world"
  clean = clean.replace(/\s+/g, ' ').trim()
  
  // 8. Tokeniza (agora seguro com split simples)
  let tokens = clean ? clean.split(' ') : []
  let expandedTokens = []
  
  tokens.forEach(token => {
    // Remove apóstrofos soltos nas pontas (ex: "'cause" -> "cause")
    const tokenClean = token.replace(/^'+|'+$/g, '')
    if (!tokenClean) return

    // Versão sem nenhum apóstrofo para busca (ex: "dont")
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

/**
 * Calcula diferença entre texto original e texto do usuário
 * Usa algoritmo Wagner-Fischer (edit distance)
 * * @param {string} originalText - Transcrição correta
 * @param {string} userText - O que o aluno digitou
 * @param {string} episodeTitle - Título do episódio (para ignorar se digitado)
 * @returns {Object} { diffResult, score, correctCount, total, extraCount, missingCount, wrongCount }
 */
export function calculateDiff(originalText, userText, episodeTitle = "") {
  const origTokens = normalizeAndTokenize(originalText)
  const userTokens = normalizeAndTokenize(userText)
  const titleTokens = normalizeAndTokenize(episodeTitle)
  let startUserIndex = 0

  // 1. Ignora cabeçalhos (ex: "Episode 1", "Chapter 2")
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

  // 2. Ignora título do episódio se digitado
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
          dp[i - 1][j],     // Deletar (faltou no user)
          dp[i][j - 1],     // Inserir (extra no user)
          dp[i - 1][j - 1]  // Substituir (errou)
        )
      }
    }
  }

  // 4. Backtracking para gerar diff visual
  let i = N
  let j = M
  const diffReverse = []
  let correctCount = 0
  let extraCount = 0
  let missingCount = 0
  let wrongCount = 0

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === actualUserTokens[j - 1]) {
      // Match perfeito
      diffReverse.push({ type: 'correct', word: origTokens[i - 1] })
      correctCount++
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      // Palavra extra (user adicionou)
      diffReverse.push({ type: 'extra', word: actualUserTokens[j - 1] })
      extraCount++
      j--
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      // Palavra faltando (user esqueceu)
      diffReverse.push({ type: 'missing', word: origTokens[i - 1] })
      missingCount++
      i--
    } else {
      // Palavra errada (substituição)
      diffReverse.push({ type: 'wrong', word: actualUserTokens[j - 1], expected: origTokens[i - 1] })
      wrongCount++
      i--
      j--
    }
  }

  const diffResult = diffReverse.reverse()

  // 5. Adiciona cabeçalhos ignorados no início (visual)
  const headerDiffs = userTokens.slice(0, startUserIndex).map(w => ({ type: 'title', word: w }))
  const finalDiff = [...headerDiffs, ...diffResult]

  // 6. Calcula score
  const totalRelevant = origTokens.length + extraCount
  const rawScore = totalRelevant > 0 ? (correctCount / totalRelevant) * 100 : 0
  const score = Math.min(100, Math.round(rawScore))

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