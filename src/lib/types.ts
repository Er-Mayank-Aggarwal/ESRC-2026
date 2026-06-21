export interface Team {
  id: string;
  teamNumber: number;
  teamName: string;
  members: string[];
  totalScore: number;
}

export interface DailyTask {
  id: string; // YYYY-MM-DD
  date: string;
  allQuestions: string[];
  questionsPerTeam: number;
  createdAt: string;
}

export interface TeamDailyRecord {
  id: string; // teamId_YYYY-MM-DD
  teamId: string;
  date: string;
  assignedQuestionIndices: number[]; // indices into DailyTask.allQuestions
  questionCompletions: boolean[]; // per-question completion
  isCompleted: boolean; // true when ALL questions are done
  completionTime: string | null;
  dailyScore: number;
  dailyRank: number;
}

export interface LeaderboardEntry {
  teamId: string;
  teamNumber: number;
  teamName: string;
  totalScore: number;
  rank: number;
  rankChange?: number; // positive = went up (green arrow), negative = went down (red arrow), 0 = no change
}
