// src/data/series/a1/006-doctors-secret.js

export const seriesDoctorsSecret = {
  6: {
    id: 6,
    title: "The Doctor's Secret",
    level: "A1",
    genre: "Medical Drama / Romance",
    description: "Dr. Lucas saves lives, but he has a cold heart. Nurse Ana is new. She discovers the tragedy behind his anger.",
    coverImage: "/series/a1/006-doctors-secret/cover.png",
    episodes: [
      {
        id: 1,
        title: "The Mistake",
        duration: "40 sec", // Ajuste manual depois
        audioUrl: "/series/a1/006-doctors-secret/e1.mp3",
        // Sem "CRASH"
        text: `Ana is a new nurse. It is her first day at City Hospital.
She is nervous. Her hands shake.
She enters Room 302.
Dr. Lucas is there. He is the best surgeon.
He is tall, serious, and very handsome.
But his eyes... his eyes are angry.
"Nurse!" he shouts. "The scissors! Now!"
Ana runs. She trips.
The metal tray falls on the floor. It is very loud.
Silence in the room. Everyone looks at her.
Dr. Lucas looks at her.
"Get out," he whispers. "You are useless."
Ana runs to the bathroom. She cries.
She hates him. He is a monster.`,
        questions: [
          {
            id: 1,
            question: "How does Ana feel at the start?",
            options: ["Happy", "Nervous", "Angry", "Tired"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Describe Dr. Lucas's eyes.",
            options: ["Blue and happy", "Angry", "Sad", "Closed"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "What happens to the tray?",
            options: ["It falls on the floor", "Dr. Lucas catches it", "It stays on the table", "Nothing"],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 2,
        title: "Code Blue",
        duration: "46 sec", // Ajuste manual depois
        audioUrl: "/series/a1/006-doctors-secret/e2.mp3",
        // Sem "BEEP BEEP"
        text: `It is night. The hospital is quiet.
Suddenly... the alarm sounds.
Code Blue in Room 4. The patient is dying.
Ana runs. Dr. Lucas runs.
They are alone in the room.
"CPR! Now!" he shouts.
Ana pushes on the patient's chest. One, two, three.
"Don't stop, Ana!" Dr. Lucas says.
He prepares the injection.
Their arms touch. His skin is hot.
He looks at her. For one second, he is not angry. He is scared.
"Save him," he whispers.
Ana pushes hard.
Finally... the heart monitors work. The patient lives.
Dr. Lucas breathes hard. He looks at Ana's hands.
"Good job," he says.
He leaves quickly.`,
        questions: [
          {
            id: 1,
            question: "What does 'Code Blue' mean?",
            options: ["Lunch time", "Emergency (patient dying)", "Time to sleep", "New doctor"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What happens when their arms touch?",
            options: ["He pushes her", "He smiles", "His skin is hot", "She screams"],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "What does Dr. Lucas say at the end?",
            options: ["Get out", "Good job", "I love you", "Sorry"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 3,
        title: "The Locked Room",
        duration: "39 sec", // Ajuste manual depois
        audioUrl: "/series/a1/006-doctors-secret/e3.mp3",
        text: `Dr. Lucas has a private office.
The door is always locked.
Everyone says: "Never enter there."
But tonight, the door is open. Just a little.
Ana is curious. She enters.
The room is dark.
There is a desk and a chair.
On the wall, there are many certificates. "Best Doctor".
But on the desk, she sees a photo frame.
She picks it up.
It is a photo of a woman. She is laughing.
She is wearing a patient gown.
Wait. Ana knows her.
She died in this hospital two years ago.
"Put that down!" a voice says.
Dr. Lucas is at the door. He is crying.
"She was my wife," he says. "And I could not save her."`,
        questions: [
          {
            id: 1,
            question: "Is the office usually open?",
            options: ["Yes, always", "No, it is always locked", "Sometimes", "Only for nurses"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "What does Ana find on the desk?",
            options: ["Money", "A computer", "A photo of a woman", "A cat"],
            correctAnswer: 2
          },
          {
            id: 3,
            question: "Who was the woman in the photo?",
            options: ["His sister", "His mother", "His wife", "A stranger"],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 4,
        title: "The Storm",
        duration: "49 sec", // Ajuste manual depois
        audioUrl: "/series/a1/006-doctors-secret/e4.mp3",
        // Sem "BOOM"
        text: `There is a big storm outside. Thunder. Lightning.
They are in surgery. It is a difficult operation.
Suddenly... The lights go out. Darkness.
The emergency lights turn on. They are red.
Dr. Lucas stops moving.
He is shaking. He looks at the patient.
He remembers his wife. He is having a panic attack.
"I can't," he whispers. "I can't do it."
The patient is bleeding.
Ana walks to him.
She takes his hand. She squeezes it hard.
"Lucas," she says. Not Doctor. Lucas.
"Look at me. You are safe. Save him."
He looks at her eyes. He takes a deep breath.
He nods.
He finishes the surgery in the dark.
Outside, the storm stops.
Inside, he holds her hand. "Thank you, Ana."`,
        questions: [
          {
            id: 1,
            question: "What happens during the surgery?",
            options: ["The patient wakes up", "The lights go out (storm)", "Dr. Lucas sings", "Ana leaves"],
            correctAnswer: 1
          },
          {
            id: 2,
            question: "Why does Dr. Lucas stop?",
            options: ["He is hungry", "He has a panic attack", "He is angry", "He is tired"],
            correctAnswer: 1
          },
          {
            id: 3,
            question: "What does Ana call him?",
            options: ["Doctor", "Sir", "Lucas", "Boss"],
            correctAnswer: 2
          }
        ]
      }
    ]
  }
}