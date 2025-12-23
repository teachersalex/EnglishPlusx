// src/data/series/pillars.js

export const seriesPillars = {
  // ============================================
  // SÉRIE 101 - THE PILLARS (NUMBERS)
  // ============================================
  101: {
    id: 101,
    title: "The Numbers",
    level: "The Pillars",
    genre: "Foundation / Math",
    description: "A base da matemática. Unidades, Dezenas e Centenas.",
    coverImage: "/images/pillar-numbers.png",
    episodes: [
      { 
        id: 1, 
        title: "Zero to Ten", 
        description: "DICA: O som do TH em 'Three' é soprado. O 'Six' é seco. Não engula o N do 'Seven'.",
        duration: "25 sec",
        audioUrl: "/audio/numbers_01.mp3",
        text: "one two three four five six seven eight nine ten", 
        questions: [
          {
            id: 1,
            question: "Qual número tem o som de 'TH' (soprado)?",
            options: ["Two", "Three", "Ten"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Qual número termina com som seco (X)?",
            options: ["Six", "Seven", "Zero"],
            correctAnswer: 0
          },
          {
            id: 3,
            question: "Qual é a escrita correta?",
            options: ["Eigth", "Eight", "Eite"],
            correctAnswer: 1
          }
        ] 
      },
      { 
        id: 2, 
        title: "Eleven to Twenty", 
        description: "DICA: Do 13 ao 19, o final 'TEEN' é longo e forte. Imagine um sino tocando.",
        duration: "30 sec",
        audioUrl: "/audio/numbers_02.mp3",
        text: "eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty",
        questions: [
          {
            id: 1,
            question: "Qual é a regra do som do 13 ao 19?",
            options: ["O final é curto e rápido", "O final é longo e forte (Teen)", "O som é igual ao português"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Como se escreve 12?",
            options: ["Tweleve", "Twelve", "Twelvi"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Qual número vem depois do Fifteen?",
            options: ["Sixteen", "Seventeen", "Sixty"],
            correctAnswer: 0
          }
        ]
      },
      { 
        id: 3, 
        title: "The Tens", 
        description: "DICA: O som final 'TY' é curto e seco. A força está no COMEÇO da palavra (FOR-ty). Atenção: 'Forty' não tem a letra U.",
        duration: "30 sec",
        audioUrl: "/audio/numbers_03.mp3",
        text: "twenty thirty forty fifty sixty seventy eighty ninety",
        questions: [
          {
            id: 1,
            question: "Como se escreve 40?",
            options: ["Fourty", "Forty", "Forteen"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "O final 'TY' (nas dezenas) deve ser pronunciado de forma:",
            options: ["Longo e demorado (como Teen)", "Curto e seco", "Mudo"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Qual número vem depois de Seventy (70)?",
            options: ["Sixty", "Eighty", "Ninety"],
            correctAnswer: 1
          }
        ]
      },
      { 
        id: 4, 
        title: "The Hundreds", 
        description: "DICA: Nunca pluralize a palavra Hundred quando tiver um número antes. É 'Two Hundred', nunca 'Two Hundreds'.",
        duration: "45 sec",
        audioUrl: "/audio/numbers_04.mp3",
        text: "one hundred two hundred three hundred four hundred five hundred six hundred seven hundred eight hundred nine hundred one thousand",
        questions: [
          {
            id: 1,
            question: "Qual é o correto?",
            options: ["Two Hundreds", "Two Hundred", "Twos Hundred"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "O que vem depois de 900?",
            options: ["Ten hundred", "One thousand", "One million"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Como se escreve 400?",
            options: ["Four hundred", "For hundred", "Four hundreds"],
            correctAnswer: 0
          }
        ]
      }
    ]
  },

  // ============================================
  // SÉRIE 102 - THE PILLARS (PEOPLE)
  // ============================================
  102: {
    id: 102,
    title: "The People",
    level: "The Pillars",
    genre: "Foundation / Social",
    description: "Identidade. Eu sou, Ela é, Você está. Perguntas e respostas.",
    coverImage: "/images/pillar-people.png",
    episodes: [
      { 
        id: 1, 
        title: "I am, You are", 
        description: "Regra: I am (Eu sou) vs You are (Você é).",
        duration: "30 sec",
        audioUrl: "/audio/people_01.mp3",
        text: "i am alex i am a teacher you are a student you are happy i am ready", 
        questions: [
            { id: 1, question: "Traduza: 'I am a teacher'", options: ["Eu sou um professor", "Você é um professor", "Ele é professor"], correctAnswer: 0 },
            { id: 2, question: "Qual a forma correta?", options: ["You is", "You am", "You are"], correctAnswer: 2 },
            { id: 3, question: "O verbo 'To Be' significa:", options: ["Ter ou Haver", "Ser ou Estar", "Fazer"], correctAnswer: 1 }
        ] 
      },
      { 
        id: 2, 
        title: "He and She", 
        description: "Regra: SHE (Ela) tem som de Chiado 'Shhh'. HE (Ele) tem som de Sopro 'Rra'.",
        duration: "35 sec",
        audioUrl: "/audio/people_02.mp3",
        text: "she is maria he is john she is my friend he is my brother she is happy he is sad", 
        questions: [
            { id: 1, question: "Qual pronome tem som de 'Shhh' (Chiado)?", options: ["He", "She", "It"], correctAnswer: 1 },
            { id: 2, question: "Complete: ____ is my brother.", options: ["She", "He", "You"], correctAnswer: 1 },
            { id: 3, question: "He is sad = Ele está...", options: ["Feliz", "Triste", "Cansado"], correctAnswer: 1 }
        ]
      },
      { 
        id: 3, 
        title: "Questions", 
        description: "Regra: Para perguntar, o verbo vem ANTES. 'You are' vira 'Are you?'",
        duration: "35 sec",
        audioUrl: "/audio/people_03.mp3",
        text: "you are ready are you ready she is happy is she happy are you okay yes i am", 
        questions: [
            { id: 1, question: "Qual é a pergunta correta?", options: ["You are ready?", "Are you ready?", "Ready you are?"], correctAnswer: 1 },
            { id: 2, question: "Na pergunta, a ordem muda?", options: ["Sim, o verbo inverte", "Não, é igual ao português"], correctAnswer: 0 },
            { id: 3, question: "Resposta curta para 'Are you okay?':", options: ["Yes, I okay", "Yes, I am", "Yes, I is"], correctAnswer: 1 }
        ]
      }
    ]
  }
};