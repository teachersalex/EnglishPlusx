// src/data/series/starter/011-fake-life.js

export const seriesFakeLife = {
  11: {
    id: 11,
    title: "The Fake Life",
    level: "Starter",
    genre: "Social Satire",
    description: "Jenny tem a vida perfeita no Instagram. O quarto dela é perfeito. Mas o que está fora da foto?",
    coverImage: "/series/starter/011-fake-life/cover.png",
    episodes: [
      {
        id: 1,
        title: "Morning Routine",
        duration: "21 sec",
        audioUrl: "/series/starter/011-fake-life/e1.mp3",
        text: `Jenny wakes up at noon.
Her room is messy.
Clothes are on the floor.
She pushes the clothes under the bed.
She puts on makeup.
She takes a photo in the corner.
She holds a green juice.
Caption: "I love early mornings! #Healthy."
She posts the photo.`,
        questions: [
          { id: 1, question: "What time does she wake up?", options: ["6 AM", "Noon (12 PM)", "Midnight"], correctAnswer: 1 },
          { id: 2, question: "Is the room clean?", options: ["Yes, perfect", "No, messy", "It is empty"], correctAnswer: 1 },
          { id: 3, question: "Does she drink the juice?", options: ["Yes", "No, she just holds it", "She spills it"], correctAnswer: 1 }
        ]
      },
      {
        id: 2,
        title: "The Burger",
        duration: "20 sec",
        audioUrl: "/series/starter/011-fake-life/e2.mp3",
        text: `Jenny is hungry.
She throws the green juice away.
She orders a double burger.
And fries.
And a milkshake.
She eats fast.
She is happy.
Her phone rings.
It is a sponsor.
"We love your healthy style," they say.
"Do you want to sell our vitamins?"`,
        questions: [
          { id: 1, question: "What does she eat?", options: ["Salad", "Fruit", "Burger and fries"], correctAnswer: 2 },
          { id: 2, question: "Who calls her?", options: ["Her mom", "A sponsor", "The police"], correctAnswer: 1 },
          { id: 3, question: "Why do they like her?", options: ["Her healthy style (fake)", "Her burger", "Her voice"], correctAnswer: 0 }
        ]
      },
      {
        id: 3,
        title: "The Live Mistake",
        duration: "22 sec",
        audioUrl: "/series/starter/011-fake-life/e3.mp3",
        text: `Jenny starts a Live Video.
"Hi guys! Eat clean!" she says.
She moves the camera.
Oh no.
The burger box is on the table.
The messy clothes are on the bed.
Her mom enters the room.
"Jenny! Clean this pigsty!" her mom shouts.
Jenny freezes.
The comments go crazy.`,
        questions: [
          { id: 1, question: "What happens?", options: ["She sings", "She shows the mess by accident", "The phone breaks"], correctAnswer: 1 },
          { id: 2, question: "Who enters the room?", options: ["A fan", "Her boyfriend", "Her mom"], correctAnswer: 2 },
          { id: 3, question: "How do the followers react?", options: ["They leave", "They go crazy (comments)", "They sleep"], correctAnswer: 1 }
        ]
      },
      {
        id: 4,
        title: "Viral Fame",
        duration: "21 sec",
        audioUrl: "/series/starter/011-fake-life/e4.mp3",
        text: `Jenny cries.
"My career is over," she thinks.
She looks at the phone.
She has one million new followers.
The comments say: "Finally! A real person!"
"We love the messy room!"
Jenny smiles.
She takes a selfie with the burger.
Caption: "Real Life. #NoFilter."
The internet is weird.`,
        questions: [
          { id: 1, question: "Does she lose followers?", options: ["Yes, all of them", "No, she gains 1 million", "Nothing changes"], correctAnswer: 1 },
          { id: 2, question: "Why do people like it?", options: ["She is rich", "She is 'real'", "She is fitness"], correctAnswer: 1 },
          { id: 3, question: "What is the new hashtag?", options: ["#Healthy", "#NoFilter", "#Fake"], correctAnswer: 1 }
        ]
      }
    ]
  }
}