import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/listening-tests?code=TEST1
// 시험 코드로 시험 정보 + 문항 전체 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: '시험 코드가 필요합니다.' },
      { status: 400 }
    );
  }

  // 1. 시험 정보 조회
  const { data: test, error: testError } = await supabase
    .from('listening_tests')
    .select('*')
    .eq('access_code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (testError) {
    console.error('시험 조회 오류:', testError);
    return NextResponse.json(
      { error: '시험 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }

  if (!test) {
    return NextResponse.json(
      { error: `"${code}" 코드의 시험을 찾을 수 없습니다.` },
      { status: 404 }
    );
  }

  // 2. 해당 시험의 문항들 조회 (번호 순서대로)
  const { data: questions, error: questionsError } = await supabase
    .from('listening_questions')
    .select('*')
    .eq('test_id', test.id)
    .order('question_number', { ascending: true });

  if (questionsError) {
    console.error('문항 조회 오류:', questionsError);
    return NextResponse.json(
      { error: '문항 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }

  // 3. 시험 정보 + 문항 합쳐서 반환
  return NextResponse.json({
    ...test,
    questions: questions || [],
  });
}