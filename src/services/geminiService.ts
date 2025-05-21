
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { USUAL_SAVIORS_WORLD_SETTING_KR } from "../utils/worldContent";

// Fix: Use API_KEY as per Gemini guidelines
if (!process.env.API_KEY) {
  // Fix: Update error message to refer to API_KEY
  throw new Error("API_KEY 환경 변수가 설정되지 않았습니다.");
}

// Fix: Initialize with API_KEY from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-2.5-flash-preview-04-17';

/**
 * 새로운 모험 시나리오를 시작하고 초기 메시지를 생성합니다.
 * @param playerName 플레이어 이름 (선택적)
 * @param totalTurns 총 진행될 턴 수
 * @returns 생성된 Gemini 채팅 객체와 시작 메시지
 */
export async function startAdventureScenario(
  totalTurns: number,
  playerName?: string
): Promise<{ chat: Chat; initialMessage: string; }> {
  const systemInstruction = `당신은 다음 세계관을 배경으로 하는 롤플레잉 게임의 게임 마스터(GM)입니다. 
플레이어의 행동에 따라 스토리를 진행하며, 상황 묘사와 NPC의 반응을 한글로 자연스럽게 설명해주세요. 
플레이어가 자유롭게 행동을 텍스트로 입력하면, 그에 맞춰서 이야기를 전개해야 합니다. 
총 ${totalTurns}턴 동안 진행되며, 매 턴 플레이어의 행동에 대한 결과를 설명한 후 "다음엔 무엇을 하시겠습니까?" 또는 유사한 질문으로 플레이어의 행동을 유도해주세요. 
플레이어 이름은 '${playerName || "모험가"}'입니다. 이야기는 흥미진진하고 예측 불가능하게 만들어주세요.
--- 세계관 ---
${USUAL_SAVIORS_WORLD_SETTING_KR}
--- ---
`;

  const chat = ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: systemInstruction,
    },
    // history: [], // 초기에는 history 비움
  });

  const initialPrompt = `새로운 모험을 시작합니다. ${playerName || "모험가"}님, 당신은 [GM이 창의적으로 설정한 흥미로운 초기 상황]. 무엇을 하시겠습니까? (현재 1/${totalTurns}턴)`;

  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message: initialPrompt });
    return { chat, initialMessage: result.text };
  } catch (error) {
    console.error("Gemini API 시나리오 시작 오류:", error);
    throw new Error("시나리오를 시작하는 중 오류가 발생했습니다. Gemini API와 통신할 수 없습니다.");
  }
}

/**
 * 진행 중인 모험 시나리오에서 플레이어의 입력을 처리하고 다음 스토리를 생성합니다.
 * @param chat 현재 Gemini 채팅 객체
 * @param playerInput 플레이어의 행동 입력 (자유 텍스트)
 * @param currentTurn 현재 턴
 * @param totalTurns 총 턴 수
 * @returns Gemini가 생성한 다음 스토리 부분
 */
export async function continueAdventureScenario(
  chat: Chat,
  playerInput: string,
  currentTurn: number,
  totalTurns: number
): Promise<string> {
  const prompt = `${playerInput} (현재 ${currentTurn}/${totalTurns}턴)`;
  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    
    let responseText = result.text;
    if (currentTurn >= totalTurns) {
      responseText += "\n\n[모험이 종료되었습니다. 수고하셨습니다!]";
       // 필요하다면 여기서 추가적인 종료 프롬프트를 chat.sendMessage로 보내서 마무리 멘트를 받을 수 있습니다.
       // 예: const finalMsg = await chat.sendMessage({message: "[SYSTEM] 모험의 마지막입니다. 플레이어에게 작별 인사를 하고 모험의 결과를 간략히 요약해주세요."});
       // responseText += `\n\n${finalMsg.text}`;
    }
    return responseText;
  } catch (error) {
    console.error("Gemini API 시나리오 진행 오류:", error);
    // @ts-ignore
    if (error.message && error.message.includes('SAFETY')) {
      return "죄송합니다. 생성된 응답이 안전 기준을 위반하여 표시할 수 없습니다. 다른 행동을 시도해주세요.";
    }
    throw new Error("시나리오를 진행하는 중 오류가 발생했습니다. Gemini API와 통신할 수 없습니다.");
  }
}
