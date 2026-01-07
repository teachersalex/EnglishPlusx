// src/data/series/starter/008-fashion-boss.js

export const seriesFashionBoss = {
  8: {
    id: 8,
    title: "The Fashion Boss",
    level: "Starter",
    genre: "Workplace Drama",
    description: "Um vestido rasgado. Um desfile em uma hora. Uma chefe que não aceita erros.",
    coverImage: "/series/starter/008-fashion-boss/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Missing Dress",
        duration: "20 sec",
        audioUrl: "/series/starter/008-fashion-boss/e1.mp3",
        text: `The fashion show starts in one hour.
Everyone is running.
My boss stands in the center.
She wears black sunglasses inside the room.
"Where is the Gold Dress?" she asks.
I look at the rack.
The dress is not there.
"Find it now!" she says.
Her voice is cold.
I run to the door.`,
        questions: [
          { id: 1, question: "When does the show start?", options: ["Tomorrow", "In one hour", "In ten minutes"], correctAnswer: 1 },
          { id: 2, question: "What is the boss wearing?", options: ["A red hat", "Black sunglasses", "Blue jeans"], correctAnswer: 1 },
          { id: 3, question: "Is the boss happy?", options: ["Yes, she smiles", "No, her voice is cold", "She is sleeping"], correctAnswer: 1 }
        ]
      },
      {
        id: 2,
        title: "The Panic",
        duration: "22 sec",
        audioUrl: "/series/starter/008-fashion-boss/e2.mp3",
        text: `I look everywhere.
I call the hotel.
I call the dry cleaners.
Finally, I find the box in a taxi.
The driver gives me the box.
I open it quickly.
My heart stops.
The dress has a big tear.
A hole in the fabric.
I have ten minutes.`,
        questions: [
          { id: 1, question: "Where is the box?", options: ["In a taxi", "In the hotel", "At home"], correctAnswer: 0 },
          { id: 2, question: "What is the problem?", options: ["The dress is blue", "The dress is torn/has a hole", "The box is empty"], correctAnswer: 1 },
          { id: 3, question: "How much time does she have?", options: ["One hour", "Ten minutes", "Two days"], correctAnswer: 1 }
        ]
      },
      {
        id: 3,
        title: "The Improvisation",
        duration: "21 sec",
        audioUrl: "/series/starter/008-fashion-boss/e3.mp3",
        text: `I do not cry.
I need a solution.
I see a vase with flowers.
Red roses.
I take a stapler.
I put a red flower over the hole.
Then I staple the flower to the dress.
It looks artistic.
It looks modern.
"Ready!" I shout.
The model puts on the dress.`,
        questions: [
          { id: 1, question: "What does she use?", options: ["Needle and thread", "Glue", "A stapler and a flower"], correctAnswer: 2 },
          { id: 2, question: "What color is the flower?", options: ["Gold", "Red", "White"], correctAnswer: 1 },
          { id: 3, question: "Does the model wear the dress?", options: ["Yes", "No, she refuses", "The dress explodes"], correctAnswer: 0 }
        ]
      },
      {
        id: 4,
        title: "The Shark Tank",
        duration: "24 sec",
        audioUrl: "/series/starter/008-fashion-boss/e4.mp3",
        text: `The model walks on the runway.
The crowd gasps.
"A red flower on gold! Genius!" a journalist shouts.
My boss removes her sunglasses.
She smiles wickedly.
"Did you plan this?" the press asks.
She looks at me.
"Of course," she says.
She takes all the credit.
Fashion is a shark tank.`,
        questions: [
          { id: 1, question: "What does the journalist say?", options: ["It is ugly", "It is genius", "It is boring"], correctAnswer: 1 },
          { id: 2, question: "Does the boss tell the truth?", options: ["Yes", "No, she lies", "She stays silent"], correctAnswer: 1 },
          { id: 3, question: "Who takes the credit?", options: ["The assistant", "The model", "The boss"], correctAnswer: 2 }
        ]
      }
    ]
  }
}