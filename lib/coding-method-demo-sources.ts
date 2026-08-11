/**
 * 1차 코딩 방법별 예시 라벨마다 A4 약 3쪽 분량 데모 원문 생성
 */
import { CODING_METHOD_ENRICH } from "./coding-enrichment";
import { FIRST_CYCLE_METHODS } from "./cmq-taxonomy";

export type MethodDemoSource = {
  id: string;
  title: string;
  chars: number;
  text: string;
};

const TARGET_CHARS = 5600;

const THEME_BANK: Record<string, string[]> = {
  ward: [
    "관찰 22:10 — N12 병동 야간 인수인계. 환자 A 침대 높이 조절, 모니터 알람음이 복도까지 울림.",
    "간호사 B: 오늘은 신규 입원이 두 명이라 인력 배치가 빡빡했어요. 가족 면담 요청도 겹쳤습니다.",
    "의사 라운드 메모: 산소포화도 변동, 수액 속도 조정. 가족은 정보 전달 타이밍에 민감하게 반응.",
    "관찰 01:40 — ICU 인접 구역에서 응급 호출. 팀이 역할 분담 후 3분 내 처치 완료.",
    "간호기록 발췌: 수면 방해 요인(소음·조명), 환자 불안 완화를 위한 짧은 대화 시도.",
    "야간 근무자: 낮 근무와 달리 의사결정이 지연될 때가 있어, 프로토콜 체크리스트를 더 자주 봅니다.",
  ],
  sns: [
    "@userA 게시(2024-03-14): 오늘도 야근… 팀 채팅은 계속 오는데 답장 타이밍이 압박으로 느껴져요 #직장",
    "댓글: 공감합니다. 인스타 스토리에만 웃는 얼굴 올리게 돼요.",
    "@userA 답글: 그래도 동료가 DM으로 응원해줘서 버텼어요. 작은 연결이 큰 차이.",
    "후속 게시: 회사 복지 공지에 대한 반응 — ‘현실과 괴리’ vs ‘그래도 나은 편’ 논쟁.",
    "해시태그 클러스터: #번아웃 #워라밸 #재택 — 감정 톤은 피로·분노·유머가 섞임.",
  ],
  focus: [
    "초점집단 G2(학부모·온라인) 진행자: 화면 공유가 끊기면 논의가 급격히 축소됩니다.",
    "참여자 P3: 아이가 카메라를 끄면 선생님이 참여를 못 본다고 해서 부담이 컸어요.",
    "P1: 오히려 채팅으로 질문하면 부끄럽지 않아서 말이 늘었습니다.",
    "P5: 학부모 모임은 정보는 많은데, 검증된 출처가 없을 때 갈등이 납니다.",
    "진행 메모: ‘공정한 참여 기회’ ‘기술 접근 격차’ 키워드가 반복됨.",
  ],
  video: [
    "영상클립 V03·교실·14분 — 교사가 모둠 활동 지시, 일부 학생은 태블릿으로 자료 검색.",
    "학생 S2(자막): 발표 순서가 정해지지 않아 서로 눈치만 봤어요.",
    "관찰: 교사가 질문을 던지면 8초 침묵 후 한 명이 먼저 답함 — 나머지는 따라 말함.",
    "클립 후반: 모둠장이 역할을 나누자 참여가 고르게 분산됨.",
    "연구자 필드노트: ‘구조 제공’이 ‘자율 참여’로 이어지는 전환 지점.",
  ],
  diary: [
    "일기 D07·3주차·가정 — 아침: 아이 등교 준비와 화상 회의가 겹침. 점심: 집중이 40분 후 급감.",
    "오후: 부모님 전화로 일정 재조정. 저녁: 과제 도움 요청에 죄책감.",
    "밤: 하루를 돌아보며 ‘버틴 것’과 ‘미뤄진 것’ 목록을 적음.",
    "3주차 반성: 루틴이 생겼지만, 예기치 못한 가족 돌봄이 계획을 자주 깨뜨림.",
    "내일 계획: 일정 블록을 25분 단위로 쪼개 보기로 함.",
  ],
  default: [
    "참여자: 처음에는 낯설었지만, 규칙이 명확해지자 참여가 늘었습니다.",
    "관찰: 공간·도구·관계가 동시에 작동하며 의미가 만들어짐.",
    "문서: 기관 지침은 형식적 준수와 실제 실천 사이의 간극을 드러냄.",
    "후속 면담: 실패 경험을 공유했을 때 팀의 반응이 이후 시도에 영향.",
    "연구자 메모: 반복되는 표현과 예외 사례를 함께 기록할 것.",
  ],
};

function themeKeyFromTitle(title: string): keyof typeof THEME_BANK {
  if (/병동|ICU|N12/i.test(title)) return "ward";
  if (/SNS|인스타|@/i.test(title)) return "sns";
  if (/초점집단|학부모/i.test(title)) return "focus";
  if (/영상|교실|V0/i.test(title)) return "video";
  if (/일기|가정|D0/i.test(title)) return "diary";
  return "default";
}

function buildSourceText(methodLabel: string, exampleTitle: string): string {
  const key = themeKeyFromTitle(exampleTitle);
  const bank = THEME_BANK[key] || THEME_BANK.default;
  let text =
    `[데모자료 · ${methodLabel}]\n` +
    `예시 맥락: ${exampleTitle}\n` +
    `분량: 약 A4 3쪽 (연구·교육용 합성 텍스트)\n\n`;
  let i = 0;
  while (text.length < TARGET_CHARS) {
    const base = bank[i % bank.length];
    const block =
      `\n--- 기록 ${i + 1} ---\n` +
      `${base}\n` +
      `(맥락 태그: ${exampleTitle})\n` +
      `분석 힌트: ${methodLabel} 관점에서 인물·장소·시간·행동·감정·가치 속성을 표시해 보세요.\n`;
    text += block;
    i += 1;
  }
  return text;
}

export function listMethodDemoSources(methodId: string): MethodDemoSource[] {
  const method = FIRST_CYCLE_METHODS.find((m) => m.id === methodId);
  const enrich = CODING_METHOD_ENRICH[methodId];
  const examples = (enrich?.examples || [method?.example || "합성 예시"]).slice(0, 5);
  const label = method?.label || methodId;
  return examples.map((title, idx) => {
    const text = buildSourceText(label, title);
    return {
      id: `${methodId}-ex${idx + 1}`,
      title,
      chars: text.length,
      text,
    };
  });
}
