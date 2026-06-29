import { GoogleGenAI } from '@google/genai';
import { buildMessagePrompt, buildPostPrompt } from './prompts';
import { parseJson } from './openrouter';

// Lazy initialize the Gemini SDK
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({ apiKey: key });
      } catch (e) {
        console.error('Failed to initialize GoogleGenAI client', e);
      }
    }
  }
  return aiClient;
}

// Fallback high-quality template generators when APIs are not configured
function getFallbackMessage(customerName: string, churnStage: string, rewardDesc: string, storeName: string, signature: string): string {
  if (churnStage === 'danger') {
    return `[${storeName}] ${customerName} 고객님, 안녕하세요.
한동안 매장에 발걸음이 뜸하셔서 많이 서운하고 안부가 궁금한 마음에 메시지 드립니다. 😢

저희를 잊지 않고 찾아주시는 마음에 보답하고자 특별한 선물을 준비했어요. 
이번 주 중 매장에 방문해주시면 따뜻한 위로가 될 수 있는 [시그니처 아메리카노 또는 소금빵 1개 무료 제공] 혜택을 드립니다!

* 매장 혜택 리워드: ${rewardDesc}

바쁜 일상 중 잠시 여유를 누리실 수 있도록 정성껏 구운 빵과 신선한 커피로 기다리고 있겠습니다.

${signature}`;
  } else if (churnStage === 'watch') {
    return `[${storeName}] ${customerName} 고객님, 늘 감사드립니다.
최근 날씨가 참 좋은데, 건강히 잘 지내고 계시나요? 

요즘 매장에 맛있는 신메뉴들이 가득 채워져 있는데, 오랜만에 고객님 생각이 나서 소식 전합니다. 
이번 주 내에 매장에 들러주시면 스탬프를 2배로 적립해 드리는 특별 이벤트를 제공해 드리려고 해요! ⭐️

* 매장 혜택 리워드: ${rewardDesc}

따뜻한 온기가 남아있을 때 드시면 가장 맛있는 저희 빵들 가득 준비해둘 테니, 편하게 찾아주세요. 

${signature}`;
  } else {
    return `[${storeName}] ${customerName} 고객님, 오랜만에 인사 올립니다.
그동안 리봇 베이커리를 기억하고 사랑해 주셔서 진심으로 감사드립니다.

마지막으로 방문해 주신 지 시간이 제법 흘러, 혹시 매장에 불편한 점이 있으셨던 건 아닐까 걱정 반, 그리움 반으로 소식을 전합니다.
고객님을 위해 특별히 마련한 음료 무료 시음 쿠폰과 함께, 따끈하게 구운 대표 빵 세트를 준비했습니다.

* 매장 혜택 리워드: ${rewardDesc}

조용하고 아늑한 매장에서 깊은 풍미의 커피와 함께 일상의 피로를 풀고 가세요. 언제든 환영합니다!

${signature}`;
  }
}

function getFallbackPost(purpose: string, details: string, benefit: string, duration: string, tone: string, emphasis: string, storeName: string) {
  return {
    instagram_post: `🍞 ${storeName}에서 전하는 특별한 소식! 🥐✨\n\n여러분을 위한 엄청난 행복 정보가 찾아왔습니다! 🧡\n\n👉 이번 홍보 테마: [${purpose}]\n\n${details || '매장에서 정성스레 준비한 스페셜 빵과 향긋한 에스프레소!'}\n\n🎁 이번 캠페인의 초특급 혜택:\n🔥 ${benefit || '선택 품목 10% 추가 할인 또는 적립금 2배!'}\n\n⏰ 기간: ${duration}\n📢 강조: ${emphasis || '당일 반죽 및 당일 소진 원칙 고수!'}\n\n따뜻한 분위기 가득한 저희 매장에 오셔서 기분 좋은 여유를 느껴보세요. 언제나 행복한 하루 되세요! ☕️`,
    naver_post: `[${storeName} 소식] 안녕하세요, ${storeName} 사장입니다.\n\n저희 매장을 아껴주시는 단골 고객분들을 위한 특별한 혜택 및 소식을 안내해 드립니다.\n\n이번 소식 주제: ${purpose}\n\n상세 설명:\n${details || '매일 아침 엄선된 프랑스산 최고급 고메 버터와 천일염으로 구워내는 정성 가득 소금빵의 깊고 부드러운 맛을 즐겨보세요.'}\n\n- 특별 제공 혜택: ${benefit || '포장 주문 시 10% 추가 혜택 적용'}\n- 진행 기간: ${duration}\n- 매장 강조점: ${emphasis || '철저한 위생 관리 및 신선한 당일 맥주 원칙!'}\n\n네이버 예약을 통해 사전 단체 주문도 가능하니 편하게 활용해 보시기 바랍니다. 감사합니다.`,
    kakao_post: `[${storeName} 카카오 채널 안내]\n\n항상 저희 매장을 방문해 주셔서 진심으로 감사드립니다.\n카카오 채널 단독 특별 할인/적립 캠페인 소식을 전달해 드립니다!\n\n💬 목적: ${purpose}\n\n${details || '정성을 듬뿍 넣은 빵들과 향긋한 음료들로 가득한 하루를 선물합니다.'}\n\n🎁 카카오채널 친구 대상 혜택:\n👉 ${benefit || '매장 카운터에 채널 화면 제시 시 빵 메뉴 10% 즉시 할인'}\n\n📆 행사 기간: ${duration}\n⚡️ 중요 안내: ${emphasis || '한정 수량 조진 시 행사가 조기 마감될 수 있습니다.'}\n\n아래의 버튼을 누르거나 매장 카운터에 인증하셔서 혜택을 놓치지 마세요!`,
    hashtags: `#${storeName.replace(/\s+/g, '')} #${purpose.replace(/\s+/g, '')} #베이커리카페 #소금빵맛집 #디저트맛집 #감성카페 #동네소금빵 #빵지순례`
  };
}

export async function generateAIMessage(
  customerName: string,
  churnStage: string,
  rewardDesc: string,
  storeName: string,
  signature: string
): Promise<string> {
  const prompt = buildMessagePrompt(customerName, churnStage, rewardDesc, storeName, signature);
  
  // 1. Try OpenRouter if key is available
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY') {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    } catch (e) {
      console.error('OpenRouter generation failed, trying Gemini', e);
    }
  }

  // 2. Try native Gemini client
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (e) {
      console.error('Gemini generation failed, falling back to templates', e);
    }
  }

  // 3. Fallback to templates
  return getFallbackMessage(customerName, churnStage, rewardDesc, storeName, signature);
}

export async function generateAIPost(
  purpose: string,
  details: string,
  benefit: string,
  duration: string,
  tone: string,
  emphasis: string,
  storeName: string
): Promise<any> {
  const prompt = buildPostPrompt(purpose, details, benefit, duration, tone, emphasis, storeName);

  // Helper to process JSON response
  const processJson = (rawText: string) => {
    try {
      const parsed = parseJson<any>(rawText);
      if (parsed && parsed.instagram_post && parsed.naver_post) {
        // Ensure kakao_post exists
        if (!parsed.kakao_post) {
          parsed.kakao_post = `[${storeName} 소식]\n\n${parsed.instagram_post}\n\n🎁 특별 혜택: ${benefit || '단독 제공'}\n⏰ 기간: ${duration}`;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse AI JSON response, applying raw extraction', e);
    }
    return null;
  };

  // 1. Try OpenRouter
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY') {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          const result = processJson(text);
          if (result) return result;
        }
      }
    } catch (e) {
      console.error('OpenRouter post generation failed, trying Gemini', e);
    }
  }

  // 2. Try native Gemini client
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      if (response && response.text) {
        const result = processJson(response.text);
        if (result) return result;
      }
    } catch (e) {
      console.error('Gemini post generation failed, falling back to templates', e);
    }
  }

  // 3. Fallback
  return getFallbackPost(purpose, details, benefit, duration, tone, emphasis, storeName);
}
