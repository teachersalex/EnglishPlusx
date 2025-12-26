// src/data/series/a1/004-wrong-phone.js

export const seriesWrongPhone = {
  4: {
    id: 4,
    title: "The Wrong Phone",
    level: "A1",
    genre: "Romance / City Life",
    description: "Uma troca acidental de celulares leva a um encontro inesperado.",
    coverImage: "/series/a1/004-wrong-phone/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Mistake",
        duration: "23 sec", // Ajuste manual depois
        audioUrl: "/series/a1/004-wrong-phone/e1.mp3",
        text: `I am at a coffee shop.
I am in a hurry.
I drink my coffee and I stand up.
My black phone is on the table.
I take the phone and I leave.
I get on the bus.
I want to call my mom.
I look at the phone.
Wait. This is not my wallpaper.
This phone is locked.
Oh no. This is not my phone!`,
        questions: [
          {
            id: 1,
            question: "Where is the narrator?",
            options: ["At home", "At a coffee shop", "In a park", "At school"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Why does he take the phone?",
            options: ["He wants to steal it", "It looks like his phone", "It is a gift", "He buys it"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "What is the problem?",
            options: ["The phone is broken", "The phone is not his", "The battery is dead", "The phone is red"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 2,
        title: "The Call",
        duration: "23 sec", // Ajuste manual depois
        audioUrl: "/series/a1/004-wrong-phone/e2.mp3",
        text: `The phone rings.
I look at the screen.
It says "Home".
I answer the call.
"Hello?" a woman says.
"Hello," I say. "I think I have your phone."
The woman laughs.
"Yes," she says. "And I have your phone."
"I am sorry," I say.
"It is okay," she says. "Where are you?"
We make a plan to meet.`,
        questions: [
          {
            id: 1,
            question: "Who calls?",
            options: ["A woman (the owner)", "A man", "The police", "His mom"],
            correctAnswer: 0
          },
          {
            id: 2,
            question: "Is the woman angry?",
            options: ["Yes, very angry", "No, she laughs", "She is crying", "She shouts"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "What do they decide to do?",
            options: ["Buy new phones", "Call the police", "Meet and exchange phones", "Nothing"],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 3,
        title: "The Meeting",
        duration: "23 sec", // Ajuste manual depois
        audioUrl: "/series/a1/004-wrong-phone/e3.mp3",
        text: `I wait at the park.
A woman walks towards me.
She is tall and she has a nice smile.
"Are you Tom?" she asks.
"Yes," I say. "Are you Alice?"
She gives me my phone.
I give her her phone.
"Thank you," I say.
"Do you want a coffee?" Alice asks.
"But... not at that coffee shop!" I say.
We laugh together.`,
        questions: [
          {
            id: 1,
            question: "Where do they meet?",
            options: ["At the office", "At the park", "At the cinema", "At the bus stop"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What is the woman's name?",
            options: ["Tom", "Jane", "Alice", "Sarah"],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "What happens at the end?",
            options: ["They go home", "They fight", "They go for a coffee", "They lose the phones again"],
            correctAnswer: 2
          }
        ]
      }
    ]
  },
}