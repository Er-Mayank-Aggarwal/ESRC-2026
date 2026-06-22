require("dotenv").config({ path: ".env.local" });
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, getDocs, collection, updateDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dates = [
  '2026-06-15', 
  '2026-06-16', 
  '2026-06-18', 
  '2026-06-19', 
  '2026-06-20'
];

const testQuestions = [
  "Test Question 1: Describe the vulnerability",
  "Test Question 2: Decrypt this payload",
  "Test Question 3: Find the flag",
  "Test Question 4: Analyze the network capture",
  "Test Question 5: Provide the solution script"
];

async function seed() {
  const teamsSnap = await getDocs(collection(db, "teams"));
  const teams = [];
  teamsSnap.forEach(d => teams.push(d.data()));

  for (const date of dates) {
    // Create DailyTask
    await setDoc(doc(db, "dailyTasks", date), {
      id: date,
      date,
      allQuestions: testQuestions,
      questionsPerTeam: 5,
      createdAt: new Date().toISOString()
    });

    // Distribute to Teams
    for (const team of teams) {
      const id = `${team.id}_${date}`;
      // Just set assignedQuestionIndices directly for simplicity 0..4
      const record = {
        id,
        teamId: team.id,
        date,
        assignedQuestionIndices: [0, 1, 2, 3, 4],
        questionCompletions: [false, false, false, false, false],
        isCompleted: false,
        completionTime: null,
        dailyScore: 0,
        dailyRank: 0
      };
      await setDoc(doc(db, "teamDailyRecords", id), record);
    }
    console.log(`Seeded ${date} for ${teams.length} teams`);
  }
}

seed().then(() => {
  console.log("Done!");
  process.exit(0);
}).catch(console.error);
