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
