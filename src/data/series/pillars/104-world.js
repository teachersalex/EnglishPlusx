export const seriesWorld = {
  104: {
    id: 104,
    title: "The World",
    level: "The Pillars",
    genre: "Foundation / Describing",
    description: "Cores, adjetivos e natureza. Aprendendo a descrever o mundo.",
    coverImage: "/series/pillars/104-world/cover.png",
    episodes: [
      {
        id: 1,
        title: "Colors",
        duration: "13 sec", 
        audioUrl: "/series/pillars/104-world/e1.mp3",
        text: "the car is red the sky is blue the grass is green the sun is yellow the snow is white the night is black",
        questions: [
          {
            id: 1,
            question: "Qual a cor do céu (sky)?",
            options: ["Red", "Blue", "Green"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Traduza: The snow is white",
            options: ["A neve é branca", "O sol é branco", "A neve é gelada"],
            correctAnswer: 0
          },
          {
            id: 3,
            question: "O oposto de White é:",
            options: ["Yellow", "Black", "Red"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 2,
        title: "Adjectives",
        duration: "11 sec", 
        audioUrl: "/series/pillars/104-world/e2.mp3",
        text: "the coffee is hot the ice is cold the elephant is big the mouse is small the boy is happy the girl is sad",
        questions: [
          {
            id: 1,
            question: "O café (coffee) está:",
            options: ["Cold (frio)", "Hot (quente)", "Big (grande)"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Qual o oposto de Big?",
            options: ["Small", "Hot", "Happy"],
            correctAnswer: 0
          },
          {
            id: 3,
            question: "Sad significa:",
            options: ["Feliz", "Triste", "Cansado"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 3,
        title: "Nature",
        duration: "12 sec", 
        audioUrl: "/series/pillars/104-world/e3.mp3",
        text: "the tree is green the river is blue the fire is hot the rock is hard the flower is beautiful the moon is white",
        questions: [
          {
            id: 1,
            question: "Como se diz 'Árvore'?",
            options: ["Tree", "Three", "Tea"],
            correctAnswer: 0
          },
          {
            id: 2,
            question: "O fogo (fire) é:",
            options: ["Cold", "Hot", "Wet"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Beautiful significa:",
            options: ["Feio", "Bonito/Bela", "Grande"],
            correctAnswer: 1
          }
        ]
      }
    ]
  }
}