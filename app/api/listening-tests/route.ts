import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/listening-tests
//   - ?code=TEST1 → 시험 코드로 단일 시험 + 문항 조회 (학생용)
//   - 파라미터 없음 → 모든 시험 목록 + 응시자 수 (관리자용)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  // ── 단일 시험 조회 (학생용) ──
  if (code) {
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

    return NextResponse.json({
      ...test,
      questions: questions || [],
    });
  }

  // ── 전체 시험 목록 조회 (관리자용) ──
  const { data: tests, error: testsError } = await supabase
    .from('listening_tests')
    .select('*')
    .order('created_at', { ascending: false });

  if (testsError) {
    console.error('시험 목록 조회 오류:', testsError);
    return NextResponse.json(
      { error: '시험 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }

  // 각 시험의 응시자 수와 문항 수 추가
  const testsWithCounts = await Promise.all(
    (tests || []).map(async (test) => {
      const [{ count: attemptCount }, { count: questionCount }] = await Promise.all([
        supabase
          .from('listening_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id)
          .not('submitted_at', 'is', null),
        supabase
          .from('listening_questions')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id),
      ]);
      return {
        ...test,
        attempt_count: attemptCount || 0,
        question_count: questionCount || 0,
      };
    })
  );

  return NextResponse.json(testsWithCounts);
}