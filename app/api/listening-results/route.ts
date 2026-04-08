import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/listening-results
// 학생의 응시 결과 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      test_id,
      student_name,
      student_identifier,
      answers,
      score,
      total,
      time_spent_seconds,
      replay_counts,
    } = body;

    // 필수 값 검증
    if (!test_id || !student_name) {
      return NextResponse.json(
        { error: '시험 정보와 학생 이름이 필요합니다.' },
        { status: 400 }
      );
    }

    // 중복 응시 확인
    const { data: existing } = await supabase
      .from('listening_attempts')
      .select('id')
      .eq('test_id', test_id)
      .eq('student_name', student_name.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: '이미 응시한 시험입니다.', already_submitted: true },
        { status: 409 }
      );
    }

    // 응시 기록 저장
    const { data, error } = await supabase
      .from('listening_attempts')
      .insert({
        test_id,
        student_name: student_name.trim(),
        student_identifier: student_identifier || null,
        answers,
        score,
        total,
        time_spent_seconds,
        replay_counts,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('응시 기록 저장 오류:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, attempt: data });
  } catch (err: any) {
    console.error('처리 오류:', err);
    return NextResponse.json(
      { error: err.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/listening-results?test_id=xxx
// 선생님용: 특정 시험의 모든 응시 기록 조회 (나중에 관리자 화면용)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const test_id = searchParams.get('test_id');

  if (!test_id) {
    return NextResponse.json(
      { error: 'test_id가 필요합니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('listening_attempts')
    .select('*')
    .eq('test_id', test_id)
    .order('submitted_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}