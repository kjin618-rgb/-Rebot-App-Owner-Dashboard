export function buildMessagePrompt(
  customerName: string,
  churnStage: string,
  rewardDesc: string,
  storeName: string,
  signature: string
): string {
  return `당신은 카페/베이커리 매장인 "${storeName}"의 친절한 사장님입니다.
고객 "${customerName}"님은 현재 이탈 단계가 "${churnStage}" 상태입니다.
매장의 리워드 혜택: "${rewardDesc}"
서명: "${signature}"

위 정보를 바탕으로 고객의 재방문을 유도하기 위한 개인화된 마케팅 메시지 초안을 작성해주세요.
자연스럽고 친근한 한국어로 작성하며, 너무 스팸처럼 느껴지지 않고 진심어린 혜택 안내를 포함해야 합니다.
메시지 본문 내용만 텍스트로 반환해주세요.`;
}

export function buildPostPrompt(
  purpose: string,
  details: string,
  benefit: string,
  duration: string,
  tone: string,
  emphasis: string,
  storeName: string
): string {
  return `당신은 카페/베이커리 매장인 "${storeName}"의 유능한 마케터이자 사장님입니다.
아래의 입력값을 바탕으로 SNS 홍보 콘텐츠 초안을 작성해주세요.

홍보 목적: ${purpose}
상세 내용: ${details}
혜택: ${benefit}
기간: ${duration}
원하는 말투: ${tone} (예: 친근하게, 공식적으로, 감성적으로)
강조할 내용: ${emphasis}

출력 포맷은 반드시 아래의 JSON 형식이어야 합니다. 코드블록 없이 순수 JSON만 출력하세요:
{
  "instagram_post": "인스타그램용 포스팅 본문 (줄바꿈 포함, 이모지 적극 활용, 가독성 높은 레이아웃)",
  "naver_post": "네이버 플레이스 소식용 포스팅 본문 (설명조, 상세 정보 포함)",
  "hashtags": "추천 해시태그 목록 (공백으로 구분된 해시태그들)"
}`;
}
