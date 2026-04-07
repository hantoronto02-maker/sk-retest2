import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/results?examCode=xxx — 시험별 결과 조회 (관리자)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const examCode = searchParams.get('examCode');

  const query = supabase.from('results').select('*').order('submitted_at', { ascending: false });
  if (examCode) query.eq('exam_code', examCode);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/results — 결과 제출 (학생)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exam_code, student_name, total, max_score, passed, details } = body;

  // 중복 제출 확인
  const { data: existing } = await supabase
    .from('results')
    .select('id')
    .eq('exam_code', exam_code)
    .eq('student_name', student_name)
    .single();

  if (existing) {
    return NextResponse.json({ error: '이미 제출한 시험입니다.' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('results')
    .insert({ exam_code, student_name, total, max_score, passed, details })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
