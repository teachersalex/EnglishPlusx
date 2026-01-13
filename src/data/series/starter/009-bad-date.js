// src/data/series/starter/009-bad-date.js

export const seriesBadDate = {
  9: {
    id: 9,
    title: "The Bad Date",
    level: "Starter",
    genre: "Romantic Comedy",
    description: "Ele parece um príncipe no aplicativo. Na vida real, ele é um sapo sem carteira.",
    coverImage: "/series/starter/009-bad-date/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Profile",
        duration: "22 sec",
        audioUrl: "/series/starter/009-bad-date/e1.mp3",
        text: `I look at his photo.
His name is Brad.
He is a doctor.
He has blue eyes and a nice smile.
We talk for two weeks.
He is funny.
"Let's meet," he says.
"Dinner at the Italian place."
I am excited.
I wear my best dress.`,
        questions: [
          { id: 1, question: "What is his job?", options: ["Teacher", "Doctor", "Pilot"], correctAnswer: 1 },
          { id: 2, question: "Where is the dinner?", options: ["At the park", "At an Italian place", "In his car"], correctAnswer: 1 },
          { id: 3, question: "How does she feel?", options: ["Sad", "Excited", "Angry"], correctAnswer: 1 }
        ]
      },
      {
        id: 2,
        title: "The Reality",
        duration: "23 sec",
        audioUrl: "/series/starter/009-bad-date/e2.mp3",
        text: `I arrive at the restaurant.
I see a man.
It is Brad.
But he is different.
Not like the photo.
He does not stand up.
He does not smile.
"You are late," he says.
He chews gum with his mouth open.
This is a mistake.`,
        questions: [
          { id: 1, question: "Is he like the photo?", options: ["Yes, identical", "No, he is different", "He is invisible"], correctAnswer: 1 },
          { id: 2, question: "What is he doing?", options: ["Smiling", "Chewing gum", "Reading a book"], correctAnswer: 1 },
          { id: 3, question: "Is he polite?", options: ["Yes", "No, he is rude", "He is charming"], correctAnswer: 1 }
        ]
      },
      {
        id: 3,
        title: "The Wallet",
        duration: "23 sec",
        audioUrl: "/series/starter/009-bad-date/e3.mp3",
        text: `The dinner is terrible.
He talks only about his ex-girlfriend.
He eats my pasta.
The waiter brings the bill.
Brad touches his pockets.
"Oh no," he says.
"I forgot my wallet."
He looks at me.
"Can you pay, babe?"
I look at the bill. It is expensive.`,
        questions: [
          { id: 1, question: "What does he talk about?", options: ["Politics", "His ex-girlfriend", "Football"], correctAnswer: 1 },
          { id: 2, question: "What is the problem?", options: ["He forgot his wallet", "The card is broken", "The food is free"], correctAnswer: 0 },
          { id: 3, question: "What does he ask?", options: ["Can you run?", "Can you pay?", "Can you cook?"], correctAnswer: 1 }
        ]
      },
      {
        id: 4,
        title: "The Exit",
        duration: "23 sec",
        audioUrl: "/series/starter/009-bad-date/e4.mp3",
        text: `I take my card.
I pay the full bill.
Brad smiles. "Thanks. You are great."
I stand up.
"The Uber is here," I say.
"For us?" he asks.
"No. For me."
"How do I go home?" he asks.
"Walk," I say.
I leave him alone at the table.`,
        questions: [
          { id: 1, question: "Does she pay?", options: ["No", "Yes, the full bill", "Only half"], correctAnswer: 1 },
          { id: 2, question: "Who is the Uber for?", options: ["For both", "For her only", "For Brad"], correctAnswer: 1 },
          { id: 3, question: "What does she tell him to do?", options: ["Sing", "Walk", "Sleep"], correctAnswer: 1 }
        ]
      }
    ]
  }
}