import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/exams — 전체 시험 목록
export async function GET() {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/exams — 시험 등록 (관리자)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adminPassword, ...exam } = body;

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '권한 없음' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('exams')
    .upsert({ ...exam, id: exam.code })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/exams?code=xxx — 시험 삭제 (관리자)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const adminPassword = req.headers.get('x-admin-password');

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '권한 없음' }, { status: 401 });
  }

  const { error } = await supabase.from('exams').delete().eq('code', code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
