import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, deleteDoc } from "firebase/firestore";
import type { Team, DailyTask, TeamDailyRecord, LeaderboardEntry } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export function getCompetitionDay(dateString: string): number {
  const start = new Date("2026-06-15T00:00:00Z");
  const target = new Date(dateString + "T00:00:00Z");
  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

import { seedTeams as realTeamsData, seedRecords } from "./seedData";

export async function seedTeamsIfEmpty() {
  const snapshot = await getDocs(collection(db, "teams"));
  if (snapshot.empty) {
    for (const team of realTeamsData) {
      await setDoc(doc(db, "teams", team.id), team);
    }
    for (const record of seedRecords) {
      await setDoc(doc(db, "teamDailyRecords", record.id), record);
    }
  }
}

// ─── Teams ────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  await seedTeamsIfEmpty();
  const snapshot = await getDocs(collection(db, "teams"));
  return snapshot.docs.map(d => d.data() as Team).sort((a, b) => a.teamNumber - b.teamNumber);
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const d = await getDoc(doc(db, "teams", teamId));
  if (!d.exists()) return null;
  return d.data() as Team;
}

export async function updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
  await updateDoc(doc(db, "teams", teamId), updates);
}

// ─── Holidays ─────────────────────────────────────────────────────────

export async function getCustomHolidays(): Promise<string[]> {
  const d = await getDoc(doc(db, "config", "holidays"));
  if (!d.exists()) return [];
  return d.data().dates || [];
}

export async function addCustomHoliday(date: string): Promise<void> {
  const holidays = await getCustomHolidays();
  if (!holidays.includes(date)) {
    await setDoc(doc(db, "config", "holidays"), { dates: [...holidays, date] }, { merge: true });
  }
}

export async function removeCustomHoliday(date: string): Promise<void> {
  let holidays = await getCustomHolidays();
  holidays = holidays.filter(h => h !== date);
  await setDoc(doc(db, "config", "holidays"), { dates: holidays }, { merge: true });
}

export async function checkIsHoliday(date: string): Promise<boolean> {
  const custom = await getCustomHolidays();
  if (custom.includes(date)) return true;
  const d = new Date(date + "T00:00:00Z");
  return d.getUTCDay() === 0; // Sunday
}

// ─── Daily Tasks ──────────────────────────────────────────────────────

export async function getDailyTask(date: string): Promise<DailyTask | null> {
  const d = await getDoc(doc(db, "dailyTasks", date));
  if (!d.exists()) return null;
  return d.data() as DailyTask;
}

export async function getAllDailyTasks(): Promise<DailyTask[]> {
  const snapshot = await getDocs(collection(db, "dailyTasks"));
  return snapshot.docs.map(d => d.data() as DailyTask).sort((a, b) => a.date.localeCompare(b.date));
}

export async function createDailyTask(date: string, allQuestions: string[], questionsPerTeam: number): Promise<void> {
  await setDoc(doc(db, "dailyTasks", date), {
    id: date,
    date,
    allQuestions,
    questionsPerTeam,
    createdAt: new Date().toISOString()
  });
}

export async function updateTaskQuestionsPerTeam(date: string, newCount: number): Promise<void> {
  const task = await getDailyTask(date);
  if (task) {
    await updateDoc(doc(db, "dailyTasks", date), { questionsPerTeam: newCount });
  }
}

export async function updateQuestionText(date: string, qIdx: number, text: string): Promise<void> {
  const task = await getDailyTask(date);
  if (task) {
    task.allQuestions[qIdx] = text;
    await updateDoc(doc(db, "dailyTasks", date), { allQuestions: task.allQuestions });
  }
}

export async function addQuestionToDay(date: string, text: string): Promise<void> {
  const task = await getDailyTask(date);
  if (task) {
    task.allQuestions.push(text);
    await updateDoc(doc(db, "dailyTasks", date), { allQuestions: task.allQuestions });
  } else {
    // Should generally be created with questionsPerTeam by the admin UI first
    await createDailyTask(date, [text], 4); 
  }
}

export async function deleteQuestionFromDay(date: string, qIdx: number): Promise<void> {
  const task = await getDailyTask(date);
  if (task) {
    task.allQuestions.splice(qIdx, 1);
    await updateDoc(doc(db, "dailyTasks", date), { allQuestions: task.allQuestions });
  }
}

// ─── Team Daily Records ───────────────────────────────────────────────

export async function getTeamDailyRecord(teamId: string, date: string): Promise<TeamDailyRecord | null> {
  const id = `${teamId}_${date}`;
  const d = await getDoc(doc(db, "teamDailyRecords", id));
  if (!d.exists()) return null;
  return d.data() as TeamDailyRecord;
}

export async function getTeamAllRecords(teamId: string): Promise<TeamDailyRecord[]> {
  const q = query(collection(db, "teamDailyRecords"), where("teamId", "==", teamId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as TeamDailyRecord).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAllRecordsForDate(date: string): Promise<TeamDailyRecord[]> {
  const q = query(collection(db, "teamDailyRecords"), where("date", "==", date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as TeamDailyRecord);
}

export async function createTeamDailyRecord(teamId: string, date: string, numQuestions: number, totalQuestions?: number): Promise<void> {
  const id = `${teamId}_${date}`;
  
  let assignedQuestionIndices = Array.from({ length: numQuestions }, (_, i) => i);
  if (totalQuestions && totalQuestions >= numQuestions) {
    const allIndices = Array.from({ length: totalQuestions }, (_, i) => i);
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    assignedQuestionIndices = allIndices.slice(0, numQuestions);
  }

  const record: TeamDailyRecord = {
    id,
    teamId,
    date,
    assignedQuestionIndices,
    questionCompletions: Array(numQuestions).fill(false),
    isCompleted: false,
    completionTime: null,
    dailyScore: 0,
    dailyRank: 0
  };
  await setDoc(doc(db, "teamDailyRecords", id), record);
}

export async function toggleQuestionCompletion(teamId: string, date: string, qIdx: number): Promise<void> {
  const record = await getTeamDailyRecord(teamId, date);
  if (!record) return;
  
  record.questionCompletions[qIdx] = !record.questionCompletions[qIdx];
  record.isCompleted = record.questionCompletions.every(Boolean);
  record.completionTime = record.isCompleted ? new Date().toISOString() : null;
  
  await updateDoc(doc(db, "teamDailyRecords", record.id), {
    questionCompletions: record.questionCompletions,
    isCompleted: record.isCompleted,
    completionTime: record.completionTime,
  });
}

export async function markTaskComplete(teamId: string, date: string): Promise<void> {
  const record = await getTeamDailyRecord(teamId, date);
  if (!record) return;
  record.questionCompletions = record.questionCompletions.map(() => true);
  await updateDoc(doc(db, "teamDailyRecords", record.id), {
    questionCompletions: record.questionCompletions,
    isCompleted: true,
    completionTime: new Date().toISOString()
  });
}

export async function markTaskIncomplete(teamId: string, date: string): Promise<void> {
  const record = await getTeamDailyRecord(teamId, date);
  if (!record) return;
  await updateDoc(doc(db, "teamDailyRecords", record.id), {
    isCompleted: false,
    completionTime: null
  });
}

export function evaluateScore(expr: string): number {
  try {
    const s = expr.trim();
    if (/^[\d+\-*\/\s.]+$/.test(s)) {
      return new Function('return ' + s)();
    }
  } catch(e) {}
  return parseInt(expr) || 0;
}

export async function updateDailyScore(teamId: string, date: string, scoreStr: string): Promise<void> {
  const record = await getTeamDailyRecord(teamId, date);
  if (!record) return;

  const currentScore = record.dailyScore;
  const newScore = evaluateScore(scoreStr);
  const diff = newScore - currentScore;

  await updateDoc(doc(db, "teamDailyRecords", record.id), {
    dailyScore: newScore
  });

  if (diff !== 0) {
    const team = await getTeamById(teamId);
    if (team) {
      await updateDoc(doc(db, "teams", teamId), {
        totalScore: team.totalScore + diff
      });
    }
  }
}

// ─── Leaderboard ─────────────────────────────────────────────────────

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const teams = await getTeams();
  const snapshot = await getDocs(collection(db, "teamDailyRecords"));
  const allRecords = snapshot.docs.map(d => d.data() as TeamDailyRecord);
  
  const uniqueDates = Array.from(new Set(allRecords.map(r => r.date))).sort();
  const latestDate = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : "";
  const prevDate = uniqueDates.length > 1 ? uniqueDates[uniqueDates.length - 2] : "";

  const prevScores = teams.map(t => {
    const recentRecord = allRecords.find(r => r.teamId === t.id && r.date === latestDate);
    const recentScore = recentRecord ? recentRecord.dailyScore : 0;
    const prevRecord = allRecords.find(r => r.teamId === t.id && r.date === prevDate);
    return { 
      teamId: t.id, 
      teamNumber: t.teamNumber,
      prevScore: t.totalScore - recentScore,
      prevCompletionTime: prevRecord ? prevRecord.completionTime : null
    };
  });

  prevScores.sort((a, b) => {
    if (b.prevScore !== a.prevScore) return b.prevScore - a.prevScore;
    if (!a.prevCompletionTime && !b.prevCompletionTime) return a.teamNumber - b.teamNumber;
    if (!a.prevCompletionTime) return 1;
    if (!b.prevCompletionTime) return -1;
    return a.prevCompletionTime.localeCompare(b.prevCompletionTime);
  });
  
  const prevRanks: Record<string, number> = {};
  prevScores.forEach((ps, i) => prevRanks[ps.teamId] = i + 1);

  const teamData = teams.map(t => {
    const recentRecord = allRecords.find(r => r.teamId === t.id && r.date === latestDate);
    return {
      team: t,
      completionTime: recentRecord ? recentRecord.completionTime : null
    };
  });

  teamData.sort((a, b) => {
    if (b.team.totalScore !== a.team.totalScore) return b.team.totalScore - a.team.totalScore;
    if (!a.completionTime && !b.completionTime) return a.team.teamNumber - b.team.teamNumber;
    if (!a.completionTime) return 1;
    if (!b.completionTime) return -1;
    return a.completionTime.localeCompare(b.completionTime);
  });
  
  return teamData.map(({ team: t }, i) => {
    const currentRank = i + 1;
    const prevRank = prevRanks[t.id] || currentRank;
    const rankChange = latestDate ? (prevRank - currentRank) : 0;
    return {
      teamId: t.id, 
      teamNumber: t.teamNumber, 
      teamName: t.teamName, 
      totalScore: t.totalScore, 
      rank: currentRank,
      rankChange
    };
  });
}

export async function getDailyLeaderboard(date: string): Promise<LeaderboardEntry[]> {
  const teams = await getTeams();
  const q = query(collection(db, "teamDailyRecords"), where("date", "==", date));
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(d => d.data() as TeamDailyRecord);
  
  const entries = teams.map(t => {
    const record = records.find(r => r.teamId === t.id);
    return {
      teamId: t.id,
      teamNumber: t.teamNumber,
      teamName: t.teamName,
      totalScore: record ? record.dailyScore : 0,
      rank: 0,
      completionTime: record ? record.completionTime : null
    };
  });

  entries.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (!a.completionTime && !b.completionTime) return a.teamNumber - b.teamNumber;
    if (!a.completionTime) return 1;
    if (!b.completionTime) return -1;
    return a.completionTime.localeCompare(b.completionTime);
  });
  
  return entries.map((e, i) => ({
    teamId: e.teamId,
    teamNumber: e.teamNumber,
    teamName: e.teamName,
    totalScore: e.totalScore,
    rank: i + 1,
  }));
}

// ─── Distribution ────────────────────────────────────────────────────

export async function distributeQuestions(date: string): Promise<void> {
  const task = await getDailyTask(date);
  if (!task || task.allQuestions.length === 0) return;

  const teams = await getTeams();
  for (const team of teams) {
    const record = await getTeamDailyRecord(team.id, date);
    if (!record) {
      await createTeamDailyRecord(team.id, date, task.questionsPerTeam, task.allQuestions.length);
    } else if (record.questionCompletions.length !== task.questionsPerTeam) {
      // Re-initialize question tracking array if the admin changed the # of questions
      const allIndices = Array.from({ length: task.allQuestions.length }, (_, i) => i);
      for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
      }
      const assignedQuestionIndices = allIndices.slice(0, task.questionsPerTeam);

      await updateDoc(doc(db, "teamDailyRecords", record.id), {
        assignedQuestionIndices,
        questionCompletions: Array(task.questionsPerTeam).fill(false),
        isCompleted: false,
        completionTime: null
      });
    }
  }
}

export async function forceNewDistribution(date: string): Promise<void> {
  const task = await getDailyTask(date);
  if (!task || task.allQuestions.length === 0) return;

  const teams = await getTeams();
  for (const team of teams) {
    const id = `${team.id}_${date}`;
    
    const allIndices = Array.from({ length: task.allQuestions.length }, (_, i) => i);
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    const assignedQuestionIndices = allIndices.slice(0, task.questionsPerTeam);

    const record: TeamDailyRecord = {
      id,
      teamId: team.id,
      date,
      assignedQuestionIndices,
      questionCompletions: Array(task.questionsPerTeam).fill(false),
      isCompleted: false,
      completionTime: null,
      dailyScore: 0,
      dailyRank: 0
    };
    await setDoc(doc(db, "teamDailyRecords", id), record);
  }
}

export async function revokeDistribution(date: string): Promise<void> {
  const teams = await getTeams();
  for (const team of teams) {
    const id = `${team.id}_${date}`;
    await deleteDoc(doc(db, "teamDailyRecords", id));
  }
}
