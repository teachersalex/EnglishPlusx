// src/data/series/a1/001-midnight-key.js

export const seriesMidnightKey = {
  1: {
    id: 1,
    title: "The Midnight Key",
    level: "A1",
    genre: "Mystery / Thriller",
    description: "A mysterious man, a rainy night, and a secret from the past.",
    coverImage: "/series/a1/001-midnight-key/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Visitor",
        duration: "41 sec", // <-- Ajuste conforme seu áudio
        audioUrl: "/series/a1/001-midnight-key/e1.mp3",
        text: `It is night.
It is raining.
A man enters the hotel.
He is tall.
He has a black coat.
Sarah is at the reception.
The man puts a bag on the table.
'I want a room,' the man says.
'What is your name?' Sarah asks.
'No name,' the man says.
He gives money to Sarah.
Sarah looks at the money.
The money is red.
Is it blood?
Sarah is afraid.
She gives the key to the man.
'Room 303,' she says.
The man goes to the elevator.`,
        questions: [
          {
            id: 1,
            question: "What is the weather like?",
            options: ["It is sunny.", "It is raining.", "It is snowing.", "It is hot."],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What does the man want?",
            options: ["Food.", "A taxi.", "A room.", "A doctor."],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "Why is Sarah afraid?",
            options: ["The man has a gun.", "The money is red (blood).", "The hotel is dark.", "The man is shouting."],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 2,
        title: "The Room",
        duration: "39 sec", // <-- Ajuste
        audioUrl: "/series/a1/001-midnight-key/e2.mp3",
        text: `Sarah looks at the computer.
The man is not in the system.
Sarah goes to Room 303.
The door is open.
Sarah enters the room.
The man is not there.
The window is open. The rain comes in.
The black bag is on the bed.
Sarah opens the bag.
What is inside?
It is not money.
It is a mask. A gold mask.
And a photo.
Sarah looks at the photo.
It is a photo of Sarah.`,
        questions: [
          {
            id: 1,
            question: "Where is the man?",
            options: ["In the bathroom.", "In the bed.", "He is not in the room.", "At the reception."],
            correctAnswer: 2
          },
          {
            id: 2,
            question: "What color is the mask?",
            options: ["Black.", "Red.", "Silver.", "Gold."],
            correctAnswer: 3
          },
          {
            id: 3,
            question: "What is inside the bag?",
            options: ["Money and a gun.", "A computer.", "A gold mask and a photo.", "The man's passport."],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 3,
        title: "The Secret",
        duration: "32 sec", // <-- Ajuste
        audioUrl: "/series/a1/001-midnight-key/e3.mp3",
        text: `The man comes back.
He enters through the window.
Sarah is surprised.
'Who are you?' Sarah asks.
'Why do you have my photo?'
The man looks at Sarah.
He is sad.
'You are in danger,' he says.
'Go! Run!'
'Why?' Sarah asks.
The man gives the mask to Sarah.
'I am not a bad man,' he says.
'I am your father.'
He jumps out the window.
Sarah is alone.`,
        questions: [
          {
            id: 1,
            question: "How does the man enter the room?",
            options: ["Through the door.", "Through the window.", "Through the ceiling.", "From the elevator."],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What does the man tell Sarah to do?",
            options: ["Call the police.", "Stay here.", "Run!", "Give me money."],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "Who is the man?",
            options: ["A police officer.", "Sarah's father.", "A famous actor.", "The hotel manager."],
            correctAnswer: 1
          }
        ]
      }
    ]
  },
}