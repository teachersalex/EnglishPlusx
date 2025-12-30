// src/data/series/starter/012-paris-trip.js

export const seriesParisTrip = {
  12: {
    id: 12,
    title: "The Paris Trip",
    level: "Starter",
    genre: "Travel / Slice of Life",
    description: "Sarah sonha com Paris. A Torre Eiffel. As luzes. Mas Paris tem seus próprios planos.",
    coverImage: "/series/starter/012-paris-trip/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Dream",
        duration: "19 sec",
        audioUrl: "/series/starter/012-paris-trip/e1.mp3",
        text: `Sarah saves money for two years.
She buys a ticket to France.
She packs her best clothes.
A red beret. A trench coat.
She sits on the plane.
"I am going to the City of Lights," she whispers.
She closes her eyes.
She imagines the perfect trip.`,
        questions: [
          { id: 1, question: "How long does she save money?", options: ["Two months", "Two years", "Two days"], correctAnswer: 1 },
          { id: 2, question: "What does she pack?", options: ["Swimsuit", "Red beret and trench coat", "Pajamas"], correctAnswer: 1 },
          { id: 3, question: "Where is she going?", options: ["London", "New York", "Paris (City of Lights)"], correctAnswer: 2 }
        ]
      },
      {
        id: 2,
        title: "The Problem",
        duration: "22 sec",
        audioUrl: "/series/starter/012-paris-trip/e2.mp3",
        text: `Sarah arrives in Paris.
It is raining. Hard.
She goes to the hotel.
The room is very small.
The window looks at a wall.
She goes to the Eiffel Tower.
It is closed for repairs.
Fog covers the top.
Sarah sits on a wet bench.
She wants to cry.`,
        questions: [
          { id: 1, question: "How is the weather?", options: ["Sunny", "Snowing", "Raining hard"], correctAnswer: 2 },
          { id: 2, question: "What is the view from the room?", options: ["The tower", "A wall", "The park"], correctAnswer: 1 },
          { id: 3, question: "Is the tower open?", options: ["Yes", "No, closed for repairs", "Only for VIPs"], correctAnswer: 1 }
        ]
      },
      {
        id: 3,
        title: "The Bakery",
        duration: "20 sec",
        audioUrl: "/series/starter/012-paris-trip/e3.mp3",
        text: `Sarah runs from the rain.
She enters a small shop.
It smells like butter and sugar.
It is a bakery.
An old man smiles.
"Bonjour," he says.
He gives her a croissant.
It is warm.
She takes a bite.
It is delicious.`,
        questions: [
          { id: 1, question: "Where does she enter?", options: ["A museum", "A bakery", "A bank"], correctAnswer: 1 },
          { id: 2, question: "What does she eat?", options: ["Pizza", "Sushi", "A croissant"], correctAnswer: 2 },
          { id: 3, question: "How does it taste?", options: ["Bad", "Cold", "Delicious"], correctAnswer: 2 }
        ]
      },
      {
        id: 4,
        title: "The Real Magic",
        duration: "23 sec",
        audioUrl: "/series/starter/012-paris-trip/e4.mp3",
        text: `Sarah sits by the window.
She watches the rain on the street.
She eats her croissant.
She drinks hot chocolate.
She forgets the Eiffel Tower.
This moment is perfect.
She takes a photo of the bread.
"I love Paris," she says.
Sometimes, simple is better.`,
        questions: [
          { id: 1, question: "Is she sad now?", options: ["Yes", "No, she is happy", "She is angry"], correctAnswer: 1 },
          { id: 2, question: "What does she take a photo of?", options: ["The tower", "The rain", "The bread"], correctAnswer: 2 },
          { id: 3, question: "What is the lesson?", options: ["Don't travel", "Simple is better", "Rain is bad"], correctAnswer: 1 }
        ]
      }
    ]
  }
}