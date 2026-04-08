import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Question = {
  id: string;
  type: 'multiple' | 'fill' | 'short';
  text: string;
  options?: string[];
  answer?: number | string;
  acceptedAnswers?: string[];
  keywords?: string[];
  points: number;
};

export type Exam = {
  id: string;
  code: string;
  title: string;
  subject: string;
  passing_score: number;
  passage?: string;
  questions: Question[];
  created_at?: string;
};

export type ResultDetail = {
  id: string;
  correct: boolean;
  points: number;
};

export type Result = {
  id?: string;
  exam_code: string;
  student_name: string;
  total: number;
  max_score: number;
  passed: boolean;
  details: ResultDetail[];
  submitted_at?: string;
};

// ============================================
// Listening Test 타입 (2026.04 추가)
// ============================================

export type ListeningQuestionType = 'match' | 'dictation' | 'dialogue' | 'picture' | 'price';

export type ListeningQuestion = {
  id: string;
  test_id: string;
  question_number: number;
  question_type: ListeningQuestionType;
  question_text: string;
  script: string;
  audio_url?: string | null;
  options?: string[] | null;
  image_urls?: string[] | null;
  correct_answer: string;
  explanation?: string | null;
  points: number;
};

export type ListeningTest = {
  id: string;
  title: string;
  access_code: string;
  school?: string | null;
  grade?: number | null;
  textbook?: string | null;
  unit?: string | null;
  audio_replay_limit: number;
  time_limit_minutes?: number | null;
  is_active: boolean;
  created_at?: string;
  questions?: ListeningQuestion[];
};

export type ListeningAttempt = {
  id?: string;
  test_id: string;
  student_name: string;
  student_identifier?: string | null;
  started_at?: string;
  submitted_at?: string | null;
  answers: Record<string, string>;
  score: number;
  total: number;
  time_spent_seconds?: number;
  replay_counts?: Record<string, number>;
};