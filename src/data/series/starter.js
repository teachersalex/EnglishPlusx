export const seriesStarter = {
  2: {
    id: 2,
    title: "The First Day",
    level: "Starter",
    genre: "Daily Life",
    description: "Acompanhe o primeiro dia de Tom em uma nova rotina.",
    coverImage: "/images/first-day-cover.png",
    episodes: [
      {
        id: 1,
        title: "Morning Coffee",
        duration: "45 sec",
        audioUrl: "/audio/starter_e1.mp3",
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
        duration: "45 sec",
        audioUrl: "/audio/starter_e2.mp3",
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
        duration: "45 sec",
        audioUrl: "/audio/starter_e3.mp3",
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
  },
  3: {
    id: 3,
    title: "The Mystery Box",
    level: "Starter",
    genre: "Suspense / Daily Life",
    description: "Uma entrega inesperada chega na porta. O que tem dentro?",
    coverImage: "/images/mystery-box-cover.png",
    episodes: [
      {
        id: 1,
        title: "The Delivery",
        duration: "45 sec",
        audioUrl: "/audio/mystery_e1.mp3",
        text: `The doorbell rings.
Ding-dong.
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
        duration: "45 sec",
        audioUrl: "/audio/mystery_e2.mp3",
        text: `I put the box on the table.
There is no name on it.
I shake the box.
Thump. Thump.
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
        duration: "45 sec",
        audioUrl: "/audio/mystery_e3.mp3",
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


