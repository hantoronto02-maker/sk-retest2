import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/results?examCode=xxx — 결과 조회 (관리자)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const examCode = searchParams.get('examCode');
  const adminPassword = req.headers.get('x-admin-password');

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '권한 없음' }, { status: 401 });
  }

  let query = supabase
    .from('results')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (examCode) {
    query = query.eq('exam_code', examCode);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/results — 결과 제출 (학생)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { exam_code, student_name } = body;

    // 중복 제출 확인 — maybeSingle() 사용 (없을 때 오류 안 남)
    const { data: existing, error: checkError } = await supabase
      .from('results')
      .select('id')
      .eq('exam_code', exam_code)
      .eq('student_name', student_name)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: '이미 제출한 시험입니다.' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('results')
      .insert(body)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
