// src/data/series/a1/005-red-lipstick.js

export const seriesRedLipstick = {
  5: {
    id: 5,
    title: "The Red Lipstick",
    level: "A1",
    genre: "Drama / Romance",
    description: "Lisa encontra um batom no carro do marido. Mas ela não usa batom vermelho...",
    coverImage: "/series/a1/005-red-lipstick/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Evidence",
        duration: "25 sec", // Ajuste manual
        audioUrl: "/series/a1/005-red-lipstick/e1.mp3",
        text: `Lisa is in the car.
It is her husband's car.
She looks under the seat.
She sees something small.
She takes it.
It is a lipstick.
A red lipstick.
Lisa does not wear red lipstick.
She wears pink lipstick.
She is confused.
Is this David's lipstick? No.
Is it her lipstick? No.
Who is the owner?
Lisa is angry.`,
        questions: [
          {
            id: 1,
            question: "What does Lisa find?",
            options: ["A phone", "A red lipstick", "Money", "A ring"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Where is she?",
            options: ["In her house", "In the park", "In her husband's car", "In a taxi"],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "Why is she angry?",
            options: ["She hates red", "The lipstick is not hers", "The car is dirty", "She is hungry"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 2,
        title: "The Secret Call",
        duration: "29 sec", // Ajuste manual
        audioUrl: "/series/a1/005-red-lipstick/e2.mp3",
        text: `It is night.
David is in the kitchen.
His phone rings.
He looks at the phone.
He answers quickly.
He speaks very quietly.
Lisa listens behind the door.
"Yes, tomorrow," David says.
"Do not tell Lisa. It is a secret."
"I love it. It is beautiful."
Lisa goes back to the bedroom.
She is sad.
David has a secret.
David has a girlfriend.`,
        questions: [
          {
            id: 1,
            question: "How does David speak?",
            options: ["Loudly", "Quietly", "Angrily", "Fast"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What does David say?",
            options: ["Tell Lisa", "Do not tell Lisa", "I hate it", "Goodbye"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "What does Lisa think?",
            options: ["David has a surprise", "David is hungry", "David has a girlfriend", "David is sick"],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 3,
        title: "The Blonde Woman",
        duration: "26 sec", // Ajuste manual
        audioUrl: "/series/a1/005-red-lipstick/e3.mp3",
        text: `The next day, Lisa walks on the street.
She sees David's car.
The car stops at a cafe.
A woman enters the car.
She is tall and blonde.
She wears a red dress.
And she wears... red lipstick.
David smiles at the woman.
He gives a box to the woman.
Lisa wants to scream.
She takes her phone.
She calls David.`,
        questions: [
          {
            id: 1,
            question: "Who enters the car?",
            options: ["Lisa", "A blonde woman", "A dog", "A police officer"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What is the woman wearing?",
            options: ["A blue dress", "Red lipstick and a red dress", "Pink lipstick", "A hat"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "What does Lisa do?",
            options: ["She runs away", "She calls David", "She buys a coffee", "She cries"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 4,
        title: "The Truth",
        duration: "41 sec", // Ajuste manual
        audioUrl: "/series/a1/005-red-lipstick/e4.mp3",
        text: `Lisa runs to the car.
"David!" she shouts.
David opens the window.
He is surprised.
"Who is she?" Lisa asks.
The blonde woman smiles.
"Hi, Lisa! I am Sarah. I work with David."
David laughs.
"Sarah helps me," he says.
"Helps you with what?" Lisa asks.
David opens the box.
It is a red dress.
"For your birthday," David says.
"Sarah is the model. I wanted to see the size."
"And the lipstick?"
"It fell from the bag yesterday. It is for you too."
Lisa is red.
"Oh," she says. "I love red."`,
        questions: [
          {
            id: 1,
            question: "Who is Sarah?",
            options: ["David's girlfriend", "David's sister", "David's coworker", "Lisa's friend"],
            correctAnswer: 2
          },
          {
            id: 2,
            question: "What is in the box?",
            options: ["A ring", "A red dress", "Shoes", "Food"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "How does the story end?",
            options: ["Lisa is angry", "They fight", "It is a happy misunderstanding", "David leaves"],
            correctAnswer: 2
          }
        ]
      }
    ]
  },
}