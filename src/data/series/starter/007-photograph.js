// src/data/series/starter/007-photograph.js

export const seriesPhotograph = {
  7: {
    id: 7,
    title: "The Photograph",
    level: "Starter",
    genre: "Romance / Drama",
    description: "Anna está sozinha. Ela olha para uma foto antiga. Onde está John?",
    coverImage: "/series/starter/007-photograph/cover.png",
    episodes: [
      {
        id: 1,
        title: "Alone",
        duration: "23 sec",
        audioUrl: "/series/starter/007-photograph/e1.mp3",
        text: `The room is dark.
It is raining outside.
Anna sits on the sofa.
She is alone.
The house is quiet.
She looks at a photograph.
It is a photo of John.
Anna is sad.
She cries.
"Where are you, John?" she asks.`,
        questions: [
          {
            id: 1,
            question: "How is the room?",
            options: ["Bright", "Dark", "Blue", "Hot"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Is Anna happy?",
            options: ["Yes", "No, she is sad", "She is angry", "She is tired"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "What does she look at?",
            options: ["TV", "A window", "A photograph", "A book"],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 2,
        title: "The Knock",
        duration: "20 sec",
        audioUrl: "/series/starter/007-photograph/e2.mp3",
        // Removido: "Toc. Toc. Toc."
        text: `Someone is at the door.
Anna stands up.
She wipes her eyes.
Is it John?
She runs to the door.
She opens the door.
It is not John.
It is the postman.
He has a letter.
A blue letter.`,
        questions: [
          {
            id: 1,
            question: "What sound does she hear?",
            options: ["The phone", "The TV", "The door (Toc Toc)", "Music"],
            correctAnswer: 2
          },
          {
            id: 2,
            question: "Who is at the door?",
            options: ["John", "The postman", "Her mom", "A dog"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "What does he have?",
            options: ["A pizza", "A letter", "A box", "Flowers"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 3,
        title: "The Letter",
        duration: "22 sec",
        audioUrl: "/series/starter/007-photograph/e3.mp3",
        text: `Anna opens the letter.
Her hands shake.
She reads the letter.
"Dear Anna," it says.
"I am sorry."
"I was stupid."
"I love you."
"Please, open the door again."
Anna is surprised.
She runs to the door again.`,
        questions: [
          {
            id: 1,
            question: "How does she feel?",
            options: ["Bored", "Surprised", "Hungry", "Sleepy"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What does the letter say?",
            options: ["I hate you", "Goodbye", "I love you", "Happy Birthday"],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "What does she do?",
            options: ["She sleeps", "She eats", "She runs to the door", "She cries"],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 4,
        title: "The Flowers",
        duration: "23 sec",
        audioUrl: "/series/starter/007-photograph/e4.mp3",
        text: `She opens the door.
John is there.
He is wet from the rain.
He has flowers.
Red roses.
He smiles.
"I am back," he says.
Anna smiles too.
She is not alone now.
She is happy.`,
        questions: [
          {
            id: 1,
            question: "Who is at the door now?",
            options: ["The postman", "John", "A cat", "Nobody"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What does John have?",
            options: ["A letter", "Money", "Red roses", "Food"],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "How is the ending?",
            options: ["Sad", "Happy", "Scary", "Bad"],
            correctAnswer: 1
          }
        ]
      }
    ]
  }
}