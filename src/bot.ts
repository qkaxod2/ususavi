

import { Client, GatewayIntentBits, Events, Collection, Interaction, Message } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { Command, AdventureSession, CharacterProfile } from './types';
import { handleAdventureMessage } from './commands/adventure'; // adventure.ts에서 일반 메시지 핸들러 가져오기
import { handleLoreAutocomplete } from './commands/lore'; // lore.ts에서 자동완성 핸들러 가져오기

// .env 파일에서 환경 변수 로드
dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
// Fix: Use API_KEY as per Gemini guidelines and rename variable for clarity
const apiKey = process.env.API_KEY;

if (!token) {
  console.error("DISCORD_BOT_TOKEN이 설정되지 않았습니다! .env 파일을 확인해주세요.");
  // Fix: Use process.exit(1) which is standard for Node.js and should be typed by @types/node.
  // This change addresses the error "Property 'process' does not exist on type 'typeof globalThis'".
  process.exit(1);
}

// Fix: Check for API_KEY and update warning message accordingly
if (!apiKey) {
  // Fix: Warning message refers to API_KEY
  console.warn("API_KEY가 설정되지 않았습니다. Gemini API를 사용하는 기능이 제한될 수 있습니다.");
  // Fix: If uncommented, use globalThis.process.exit to be consistent.
  // Or better, use process.exit(1) as well.
  // process.exit(1); // API 키가 필수인 경우 주석 해제
}


// 새 클라이언트 인스턴스 생성
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // 메시지 내용을 읽기 위해 필요
    GatewayIntentBits.GuildIntegrations, // 슬래시 명령어
  ],
}) as Client; // 타입 단언

// 명령어 컬렉션 추가
client.commands = new Collection<string, Command>();
// 활성 모험 세션 컬렉션 추가 (인메모리)
client.activeAdventures = new Collection<string, AdventureSession>();
// 캐릭터 프로필 컬렉션 추가 (인메모리)
client.characterProfiles = new Collection<string, CharacterProfile>();

// 명령어 파일 로드
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const commandModule = require(filePath);
  // 주 파일에서 내보낸 command 객체 또는 파일 이름 자체를 키로 사용
  const commandKey = Object.keys(commandModule)[0]; // 예: adventure.ts -> adventure
  const command = commandModule[commandKey] as Command;


  if (command && 'data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`[명령어 로드] ${command.data.name} 명령어를 성공적으로 로드했습니다.`);
  } else {
    console.warn(`[명령어 로드 경고] ${filePath} 파일에 'data' 또는 'execute' 속성이 없습니다.`);
  }
}

// 클라이언트 준비 완료 시 실행 (한 번만)
client.once(Events.ClientReady, readyClient => {
  console.log(`준비 완료! ${readyClient.user.tag}(으)로 로그인했습니다.`);
  // 봇이 참여한 모든 서버에 명령어 등록 (개발 시에는 특정 길드에만 등록하는 것이 빠를 수 있음)
  readyClient.application?.commands.set(client.commands.map(cmd => cmd.data.toJSON()))
    .then(() => console.log("슬래시 명령어를 성공적으로 등록했습니다."))
    .catch(console.error);
});

// 상호작용(슬래시 명령어, 버튼 등) 처리
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) { // 슬래시 명령어인 경우
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`${interaction.commandName} 명령어를 찾을 수 없습니다.`);
      await interaction.reply({ content: '오류: 해당 명령어를 찾을 수 없습니다!', ephemeral: true });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '명령어 실행 중 오류가 발생했습니다!', ephemeral: true });
      } else {
        await interaction.reply({ content: '명령어 실행 중 오류가 발생했습니다!', ephemeral: true });
      }
    }
  } else if (interaction.isAutocomplete()) { // 자동완성 상호작용인 경우
    if (interaction.commandName === '세계관') {
        await handleLoreAutocomplete(interaction);
    }
    // 다른 명령어에 대한 자동완성 추가 가능
  }
  // 버튼, 선택 메뉴 등의 상호작용은 여기에 추가
});

// 메시지 생성 이벤트 처리 (모험 진행용)
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return; // 봇 자신의 메시지는 무시
  if (message.interaction) return; // 슬래시 명령어로 발생한 메시지는 무시 (중복 처리 방지)

  // 활성 모험이 있는 사용자의 메시지만 처리
  if (client.activeAdventures.has(message.author.id)) {
    // Fix: Call handleAdventureMessage with the Message object directly.
    // The handleAdventureMessage function in adventure.ts is now typed to accept Message.
    await handleAdventureMessage(message);
  }
});


// Discord API에 토큰으로 로그인
client.login(token);