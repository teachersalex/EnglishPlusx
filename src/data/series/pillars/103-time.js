export const seriesTime = {
  103: {
    id: 103,
    title: "The Time",
    level: "The Pillars",
    genre: "Foundation / Calendar",
    description: "Dias, meses e horas. A organização do tempo.",
    coverImage: "/series/pillars/103-time/cover.png",
    episodes: [
      {
        id: 1,
        title: "Days of the Week",
        duration: "07 sec", // Ajuste
        audioUrl: "/series/pillars/103-time/e1.mp3",
        description: "Dica: Em inglês, os dias da semana SEMPRE começam com letra Maiúscula.",
        text: "Sunday Monday Tuesday Wednesday Thursday Friday Saturday",
        questions: [
          {
            id: 1,
            question: "Qual dia vem depois de Tuesday?",
            options: ["Monday", "Wednesday", "Thursday"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Dias da semana começam com:",
            options: ["Letra minúscula", "Letra Maiúscula", "Qualquer uma"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Como se escreve Quarta-feira?",
            options: ["Wenesday", "Wednesday", "Quartaday"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 2,
        title: "The Months",
        duration: "16 sec", // Ajuste
        audioUrl: "/series/pillars/103-time/e2.mp3",
        text: "January February March April May June July August September October November December",
        questions: [
          {
            id: 1,
            question: "Qual é o segundo mês?",
            options: ["January", "February", "March"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Como se escreve Agosto?",
            options: ["Agust", "August", "Augusto"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Qual mês vem antes de December?",
            options: ["November", "October", "January"],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 3,
        title: "What time is it?",
        duration: "13 sec", // Ajuste
        audioUrl: "/series/pillars/103-time/e3.mp3",
        text: "it is one o'clock it is two thirty it is five fifteen it is ten o'clock it is twelve forty five it is time to go",
        questions: [
          {
            id: 1,
            question: "O que significa 'o'clock'?",
            options: ["Hora exata/em ponto", "Meia hora", "Relógio quebrado"],
            correctAnswer: 0
          },
          {
            id: 2,
            question: "Two thirty é o mesmo que:",
            options: ["2:13", "2:30", "3:02"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Traduza: It is time to go",
            options: ["É hora de comer", "É hora de ir", "Que horas são?"],
            correctAnswer: 1
          }
        ]
      }
    ]
  }
}