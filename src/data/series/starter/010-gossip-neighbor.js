// src/data/series/starter/010-gossip-neighbor.js

export const seriesGossipNeighbor = {
  10: {
    id: 10,
    title: "The Gossip Neighbor",
    level: "Starter",
    genre: "Mystery / Comedy",
    description: "A vizinha nova tem um segredo. Malas misteriosas. Homens de preto. O que ela esconde?",
    coverImage: "/series/starter/010-gossip-neighbor/cover.png",
    episodes: [
      {
        id: 1,
        title: "The New Girl",
        duration: "19 sec",
        audioUrl: "/series/starter/010-gossip-neighbor/e1.mp3",
        text: `There is a new neighbor in apartment 4B.
Her name is Elena.
She is very elegant.
She wears big hats.
She never leaves during the day.
She only leaves at night.
I watch her from my window.
I am curious.
Who is Elena?`,
        questions: [
          { id: 1, question: "Which apartment is she in?", options: ["4B", "1A", "100"], correctAnswer: 0 },
          { id: 2, question: "When does she leave?", options: ["In the morning", "At lunch", "At night"], correctAnswer: 2 },
          { id: 3, question: "What does the narrator do?", options: ["Sleeps", "Watches from the window", "Calls her"], correctAnswer: 1 }
        ]
      },
      {
        id: 2,
        title: "The Suitcases",
        duration: "21 sec",
        audioUrl: "/series/starter/010-gossip-neighbor/e2.mp3",
        text: `It is midnight.
A black van stops in front of the building.
Two men get out.
They carry heavy cases.
Long black cases.
Are they guns?
Elena opens the door.
She looks nervous.
They enter her apartment.
They close the curtains.`,
        questions: [
          { id: 1, question: "What time is it?", options: ["Noon", "Midnight", "6 AM"], correctAnswer: 1 },
          { id: 2, question: "What do the men carry?", options: ["Pizza boxes", "Long black cases", "Flowers"], correctAnswer: 1 },
          { id: 3, question: "What does the narrator think they are?", options: ["Guns", "Violins", "Dogs"], correctAnswer: 0 }
        ]
      },
      {
        id: 3,
        title: "The Call",
        duration: "20 sec",
        audioUrl: "/series/starter/010-gossip-neighbor/e3.mp3",
        text: `I hear a scream.
Or is it a song?
I am scared.
This is dangerous.
I take my phone.
I dial 9-1-1.
"Police," I say.
"Something bad is happening in 4B."
"Please come fast."
The police cars arrive quickly.`,
        questions: [
          { id: 1, question: "What does the narrator hear?", options: ["A scream (or song)", "An explosion", "Silence"], correctAnswer: 0 },
          { id: 2, question: "Who does he call?", options: ["His mom", "The Police (911)", "The pizza place"], correctAnswer: 1 },
          { id: 3, question: "Is he scared?", options: ["No, he is happy", "Yes, he is scared", "He is tired"], correctAnswer: 1 }
        ]
      },
      {
        id: 4,
        title: "The Opera",
        duration: "23 sec",
        audioUrl: "/series/starter/010-gossip-neighbor/e4.mp3",
        text: `The police knock on the door.
Elena opens it.
She wears a beautiful dress.
The men are there.
They open the black cases.
It is a cello. And a violin.
Elena laughs.
"We are practicing," she says.
"I am an opera singer."
The police look at me.
I hide behind my curtain.`,
        questions: [
          { id: 1, question: "What is inside the cases?", options: ["Guns", "Money", "Instruments (Cello/Violin)"], correctAnswer: 2 },
          { id: 2, question: "What is Elena's job?", options: ["Spy", "Opera Singer", "Doctor"], correctAnswer: 1 },
          { id: 3, question: "How does the narrator feel?", options: ["Proud", "Embarrassed (Hides)", "Heroic"], correctAnswer: 1 }
        ]
      }
    ]
  }
}