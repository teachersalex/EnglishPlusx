// src/data/series/tutorial/000-first-steps.js

export const seriesFirstSteps = {
  0: {
    id: 0,
    title: "Your First Steps",
    level: "Tutorial",
    genre: "Onboarding",
    description: "Aprenda a usar o English Plus.",
    coverImage: "/series/tutorial/000-first-steps/cover.png",
    episodes: [
      {
        id: 1,
        title: "Bem-vindo",
        duration: "15 sec",
        audioUrl: "/series/tutorial/000-first-steps/e1.mp3",
        text: `Bem-vindo ao English Plus.
Sua comunidade exclusiva de inglês.
Ouça o áudio com atenção.
Escreva o que você ouvir.
Está pronto?`,
        questions: [
          {
            id: 1,
            question: "O que você deve fazer primeiro?",
            options: ["Escrever", "Ouvir", "Responder", "Pausar"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Depois de ouvir, você deve...",
            options: ["Dormir", "Escrever", "Sair", "Pular"],
            correctAnswer: 1
          }
        ]
      }
    ]
  }
}