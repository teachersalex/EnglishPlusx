// src/data/series/starter/002-first-day.js

export const seriesFirstDay = {
  2: {
    id: 2,
    title: "The First Day",
    level: "Starter",
    genre: "Daily Life",
    description: "Acompanhe o primeiro dia de Tom em uma nova rotina.",
    coverImage: "/series/starter/002-first-day/cover.png",
    episodes: [
      {
        id: 1,
        title: "Morning Coffee",
        duration: "17 sec",
        audioUrl: "/series/starter/002-first-day/e1.mp3",
        text: `I wake up.
It is 7 o'clock.
I am a little nervous.
Today is a big day.
I go to the kitchen.
I make coffee.
The coffee is hot and black.
I drink the coffee.
Now, I am ready.`,
        questions: [
          {
            id: 1,
            question: "What time is it?",
            options: ["6:00", "7:00", "8:00", "9:00"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "How does Tom feel?",
            options: ["Happy", "Sad", "Nervous", "Angry"],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "The coffee is...",
            options: ["Cold and white", "Hot and black", "Sweet and milk", "Bad"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 2,
        title: "The Bus",
        duration: "17 sec",
        audioUrl: "/series/starter/002-first-day/e2.mp3",
        text: `I open the door.
The sun is shining.
I walk to the bus stop.
The bus is blue.
It is big.
I pay the driver.
I sit down near the window.
I look at the city.
Many people are in the street.`,
        questions: [
          {
            id: 1,
            question: "What is the weather like?",
            options: ["It is raining", "The sun is shining", "It is night", "It is cold"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What color is the bus?",
            options: ["Red", "Green", "Yellow", "Blue"],
            correctAnswer: 3
          },
          {
            id: 3,
            question: "Where does Tom sit?",
            options: ["Near the door", "Near the driver", "Near the window", "On the floor"],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 3,
        title: "The New Job",
        duration: "22 sec",
        audioUrl: "/series/starter/002-first-day/e3.mp3",
        text: `The bus stops.
I see the building.
It is very tall.
I enter the office.
A woman is there.
She smiles.
'Good morning, Tom,' she says.
'Welcome to the team.'
I smile too.
I am happy now.`,
        questions: [
          {
            id: 1,
            question: "The building is...",
            options: ["Small", "Old", "Tall", "Red"],
            correctAnswer: 2
          },
          {
            id: 2,
            question: "Who is in the office?",
            options: ["A man", "A woman", "A dog", "Nobody"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "Tom is happy because...",
            options: ["The coffee is good", "The bus is blue", "He has a new job", "He is sleeping"],
            correctAnswer: 2
          }
        ]
      }
    ]
  }
}