import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { text, fileName } = await req.json();

  if (!text || text.length < 30) {
    return NextResponse.json({ error: '텍스트가 너무 짧습니다.' }, { status: 400 });
  }

  const prompt = `다음은 학원 영어 독해 재시험지에서 추출한 텍스트입니다.
이 텍스트를 분석하여 시험 정보와 문제들을 JSON 형식으로 추출해주세요.
JSON만 출력하세요. 설명, 마크다운 코드블록 없이 { 로 시작해서 } 로 끝내세요.

[추출된 텍스트]
${text.slice(0, 8000)}

[출력 형식]
{
  "title": "시험 제목 (예: [1P 독해] 03.30~04.04 재시험)",
  "subject": "과목/교재명",
  "code": "시험코드 (영문+숫자, 예: 1P01)",
  "passingScore": 80,
  "passage": "영어 지문 전체 (있는 경우, 없으면 빈 문자열)",
  "questions": [
    {
      "id": "q1",
      "type": "multiple",
      "text": "문제 내용",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 0,
      "points": 10
    },
    {
      "id": "q2",
      "type": "fill",
      "text": "빈칸 채우기 문제",
      "answer": "정답",
      "acceptedAnswers": ["정답", "유사정답"],
      "points": 10
    },
    {
      "id": "q3",
      "type": "short",
      "text": "주관식 단답형 문제",
      "keywords": ["키워드1", "키워드2"],
      "points": 10
    }
  ]
}

규칙:
- type은 반드시 "multiple", "fill", "short" 중 하나
- multiple의 answer는 0~3 (인덱스)
- 모든 points 합계가 100점이 되도록 조정
- passingScore는 텍스트에서 찾거나 없으면 80
- 문제가 불분명하면 지문 내용으로 적절한 문제 5~7개 생성`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = content.replace(/```json?/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) {
      return NextResponse.json({ error: 'JSON 파싱 실패', raw: content.slice(0, 500) }, { status: 422 });
    }

    const parsed = JSON.parse(match[0]);
    parsed.id = parsed.code || `ENG${Date.now()}`;
    parsed.passing_score = parsed.passingScore || 80;

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
