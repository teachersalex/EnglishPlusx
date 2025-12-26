// src/data/series/pillars/105-actions.js

export const seriesActions = {
  105: {
    id: 105,
    title: "The Actions",
    level: "The Pillars",
    genre: "Foundation / Verbs",
    description: "Verbos essenciais. Comer, beber, dormir e amar.",
    coverImage: "/series/pillars/105-actions/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Body",
        duration: "07 sec", // Ajuste manual depois
        audioUrl: "/series/pillars/105-actions/e1.mp3",
        description: "Ações básicas do corpo humano.",
        text: "i walk i run i sleep i wake up i stop i go",
        questions: [
          {
            id: 1,
            question: "Traduza: I sleep",
            options: ["Eu corro", "Eu durmo", "Eu acordo"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Qual o oposto de Stop (parar)?",
            options: ["Go", "Sleep", "Walk"],
            correctAnswer: 0
          },
          {
            id: 3,
            question: "Como se diz 'Eu acordo'?",
            options: ["I wake up", "I sleep up", "I run"],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 2,
        title: "The Routine",
        duration: "07 sec", // Ajuste manual depois
        audioUrl: "/series/pillars/105-actions/e2.mp3",
        text: "i eat bread i drink water i work hard i play games i study english",
        questions: [
          {
            id: 1,
            question: "O que eu bebo (drink)?",
            options: ["Bread (pão)", "Water (água)", "Games"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Traduza: I work hard",
            options: ["Eu trabalho muito", "Eu não trabalho", "Eu jogo"],
            correctAnswer: 0
          },
          {
            id: 3,
            question: "O que você está fazendo agora? (I study...)",
            options: ["Spanish", "Math", "English"],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 3,
        title: "The Feelings",
        duration: "07 sec", // Ajuste manual depois
        audioUrl: "/series/pillars/105-actions/e3.mp3",
        text: "i like pizza i love music i have a car i want coffee i need english",
        questions: [
          {
            id: 1,
            question: "Qual é mais forte?",
            options: ["Like (gostar)", "Love (amar)", "São iguais"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "I want coffee = Eu ____ café.",
            options: ["Tenho", "Quero", "Odeio"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Complete: I need ____",
            options: ["English", "Pizza", "Music"],
            correctAnswer: 0
          }
        ]
      }
    ]
  }
}