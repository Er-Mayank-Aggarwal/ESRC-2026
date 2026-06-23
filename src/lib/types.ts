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
  isEventDay?: boolean; // true if this day's scores count for leaderboard
}

export type QuestionRemark = "excellent" | "good" | "needs-work" | null;

export interface TeamDailyRecord {
  id: string; // teamId_YYYY-MM-DD
  teamId: string;
  date: string;
  assignedQuestionIndices: number[]; // indices into DailyTask.allQuestions
  questionCompletions: boolean[]; // per-question completion
  questionRemarks?: QuestionRemark[]; // per-question remark (normal days only)
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

export interface EventMode {
  mode: "off" | "viva" | "competition";
  competitionName?: string;
  date?: string; // Tracks which day this mode was set for
}
