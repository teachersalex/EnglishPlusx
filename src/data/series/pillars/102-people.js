// src/data/series/pillars/102-people.js

export const seriesPeople = {
  102: {
    id: 102,
    title: "The People",
    level: "The Pillars",
    genre: "Foundation / Social",
    description: "Identidade. Eu sou, Ela é, Você está. Perguntas e respostas.",
    // Padrão v11: Cápsula
    coverImage: "/series/pillars/102-people/cover.png",
    episodes: [
      { 
        id: 1, 
        title: "I am, You are", 
        description: "Regra: I am (Eu sou) vs You are (Você é).",
        duration: "06 sec",
        // Padrão v11: Nome curto e pasta organizada
        audioUrl: "/series/pillars/102-people/e1.mp3",
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
        duration: "08 sec",
        audioUrl: "/series/pillars/102-people/e2.mp3",
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
        duration: "08 sec",
        audioUrl: "/series/pillars/102-people/e3.mp3",
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