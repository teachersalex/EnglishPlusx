// src/data/series/pillars/101-numbers.js

export const seriesNumbers = {
  101: {
    id: 101,
    title: "The Numbers",
    level: "The Pillars",
    genre: "Foundation / Math",
    description: "A base da matemática. Unidades, Dezenas e Centenas.",
    // Caminho atualizado para a nova pasta organizada:
    coverImage: "/series/pillars/101-numbers/cover.png", 
    episodes: [
      { 
        id: 1, 
        title: "Zero to Ten", 
        description: "DICA: O som do TH em 'Three' é soprado. O 'Six' é seco. Não engula o N do 'Seven'.",
        duration: "12 sec",
        // Caminho atualizado e nome curto:
        audioUrl: "/series/pillars/101-numbers/e1.mp3",
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
        duration: "16 sec",
        audioUrl: "/series/pillars/101-numbers/e2.mp3",
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
        duration: "10 sec",
        audioUrl: "/series/pillars/101-numbers/e3.mp3",
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
        duration: "14 sec",
        audioUrl: "/series/pillars/101-numbers/e4.mp3",
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
  }
}