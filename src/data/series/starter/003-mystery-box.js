// src/data/series/starter/003-mystery-box.js

export const seriesMysteryBox = {
  3: {
    id: 3,
    title: "The Mystery Box",
    level: "Starter",
    genre: "Suspense / Daily Life",
    description: "Uma entrega inesperada chega na porta. O que tem dentro?",
    coverImage: "/series/starter/003-mystery-box/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Delivery",
        duration: "17 sec",
        audioUrl: "/series/starter/003-mystery-box/e1.mp3",
        // Removido: "Ding-dong."
        text: `The doorbell rings.
I go to the door.
A man is there.
He has a brown box.
It is very big.
'For you,' the man says.
I take the box.
It is heavy.
Who sent this?`,
        questions: [
          {
            id: 1,
            question: "Who is at the door?",
            options: ["A woman", "A man", "A dog", "A child"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "The box is...",
            options: ["Small and red", "Big and brown", "Light and blue", "Open"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Is the box heavy?",
            options: ["Yes, it is heavy.", "No, it is light.", "It is empty.", "I don't know."],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 2,
        title: "What is inside?",
        duration: "20 sec",
        audioUrl: "/series/starter/003-mystery-box/e2.mp3",
        // Removido: "Thump. Thump."
        text: `I put the box on the table.
There is no name on it.
I shake the box.
Something is inside.
It is not glass.
It is not water.
I take the scissors.
I cut the tape.
I am curious.`,
        questions: [
          {
            id: 1,
            question: "Where is the box?",
            options: ["On the floor", "On the bed", "On the table", "Outside"],
            correctAnswer: 2
          },
          {
            id: 2,
            question: "What does he use to open it?",
            options: ["A key", "A knife", "Scissors", "A pen"],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "Is there a name on the box?",
            options: ["Yes, 'Alex'", "No, no name", "Yes, 'Amazon'", "Yes, 'Mom'"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 3,
        title: "The Surprise",
        duration: "18 sec",
        audioUrl: "/series/starter/003-mystery-box/e3.mp3",
        text: `I open the box.
I see blue paper.
I remove the paper.
Wow!
It is a telescope.
A black telescope.
There is a card.
'Look at the stars,' it says.
'Happy Birthday, Dad.'
I smile.
It is a perfect gift.`,
        questions: [
          {
            id: 1,
            question: "What is inside?",
            options: ["A guitar", "A computer", "A telescope", "Clothes"],
            correctAnswer: 2
          },
          {
            id: 2,
            question: "What color is the paper?",
            options: ["Red", "Blue", "Green", "White"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Who sent the gift?",
            options: ["His mom", "His boss", "His dad", "His son/daughter ('Dad')"],
            correctAnswer: 3
          }
        ]
      }
    ]
  }
}