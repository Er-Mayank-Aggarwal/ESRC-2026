import { NextResponse } from 'next/server';
import { createDailyTask, distributeQuestions } from '@/lib/firestore';

export async function GET() {
  const dates = [
    '2026-06-15', 
    '2026-06-16', 
    '2026-06-18', 
    '2026-06-19', 
    '2026-06-20'
  ];
  
  const testQuestions = [
    "Test Question 1: Find the flag hidden in the source code.",
    "Test Question 2: Decrypt this basic base64 string.",
    "Test Question 3: Identify the vulnerability in this SQL query.",
    "Test Question 4: What is the output of this Python script?",
    "Test Question 5: Exploit the directory traversal."
  ];
  
  try {
    for (const date of dates) {
      await createDailyTask(date, testQuestions, 5);
      await distributeQuestions(date);
    }
    return NextResponse.json({ success: true, seeded: dates });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
