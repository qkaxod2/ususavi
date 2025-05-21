import { Chat } from "@google/genai";
import { Collection } from "discord.js";

// 캐릭터 프로필 타입
export interface CharacterProfile {
  id: string; // Discord 사용자 ID
  name: string; // 캐릭터 이름
  description: string; // 캐릭터 설명
  // 필요에 따라 필드 추가 (예: 능력, 소속, 배경 이야기 등)
}

// 진행 중인 모험 세션 타입
export interface AdventureSession {
  userId: string; // 모험을 진행 중인 사용자 ID
  channelId: string; // 모험이 진행 중인 채널 ID
  chat: Chat; // Gemini와의 채팅 세션
  currentTurn: number; // 현재 턴
  maxTurns: number; // 최대 턴 수
  storyLog: string[]; // 진행된 이야기 기록
}

// 세계관 설정집 항목 타입
export interface LoreEntry {
  term: string; // 용어 (검색 키로 사용)
  aliases?: string[]; // 동의어 또는 관련 용어
  description: string; // 용어 설명
  category?: string; // 분류 (예: 인물, 장소, 개념)
}

// Discord 클라이언트에 추가될 커스텀 프로퍼티 타입 (명령어 컬렉션 등)
declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
    activeAdventures: Collection<string, AdventureSession>; // 사용자 ID를 키로 하는 활성 모험 세션
    characterProfiles: Collection<string, CharacterProfile>; // 사용자 ID를 키로 하는 캐릭터 프로필
  }
}

// 슬래시 명령어 타입
export interface Command {
  data: any; // SlashCommandBuilder 또는 이와 유사한 객체
  execute: (interaction: import("discord.js").ChatInputCommandInteraction) => Promise<void>;
}
