

// Fix: Import Message type from discord.js
import { SlashCommandBuilder, ChatInputCommandInteraction, Client, Message } from 'discord.js';
import { AdventureSession, Command } from '../types';
import { startAdventureScenario, continueAdventureScenario } from '../services/geminiService';

// 랜덤 턴 수를 결정하는 함수 (3 ~ 10)
function getRandomTurns(): number {
  return Math.floor(Math.random() * 8) + 3;
}

export const adventure: Command = {
  data: new SlashCommandBuilder()
    .setName('모험시작')
    .setDescription('새로운 롤플레잉 모험을 시작합니다. GM이 당신의 이야기를 만들어줄 거예요!')
    .addStringOption(option =>
      option.setName('플레이어이름')
        .setDescription('모험에서 사용할 플레이어의 이름을 입력하세요. (선택 사항)')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client as Client;
    const userId = interaction.user.id;

    if (client.activeAdventures.has(userId)) {
      await interaction.reply({
        content: '이미 진행 중인 모험이 있습니다! 먼저 현재 모험을 `/모험종료` 명령어로 종료해주세요.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply(); // 응답 지연

    const playerName = interaction.options.getString('플레이어이름') || interaction.user.username;
    const totalTurns = getRandomTurns();

    try {
      const { chat, initialMessage } = await startAdventureScenario(totalTurns, playerName);

      const adventureSession: AdventureSession = {
        userId,
        channelId: interaction.channelId,
        chat,
        currentTurn: 1,
        maxTurns: totalTurns,
        storyLog: [initialMessage],
      };
      client.activeAdventures.set(userId, adventureSession);

      await interaction.editReply(
        `⚔️ **모험 시작!** (총 ${totalTurns}턴) ⚔️\n\n${initialMessage}\n\nGM의 메시지를 기다린 후, 다음 행동을 이 채널에 입력해주세요.`
      );

    } catch (error) {
      console.error("모험 시작 중 오류 발생:", error);
      let errorMessage = '모험을 시작하는 데 실패했습니다. 잠시 후 다시 시도해주세요.';
      if (error instanceof Error) {
        errorMessage += `\n오류: ${error.message}`;
      }
      await interaction.editReply(errorMessage);
    }
  },
};

// 메시지 이벤트 핸들러 (bot.ts에서 호출)
// Fix: Change parameter type to Message and adjust logic accordingly
export async function handleAdventureMessage(message: Message) {
  // Fix: Access client from message object
  const client = message.client as Client;
  // Fix: Get userId from message.author.id
  const userId = message.author.id;
  
  // Fix: Check for bot author using message.author.bot
  if (message.author.bot) return; // 봇 메시지 무시

  const adventureSession = client.activeAdventures.get(userId);

  // Fix: Use message.channelId
  if (adventureSession && adventureSession.channelId === message.channelId) {
    if (adventureSession.currentTurn > adventureSession.maxTurns) {
        // 이미 종료된 모험에 대한 메시지는 무시하거나, 종료되었다는 안내를 할 수 있음.
        // client.activeAdventures.delete(userId); // 세션 정리
        // await message.reply("이미 모험이 종료되었습니다. 새로운 모험은 `/모험시작` 명령어로 시작해주세요.");
        return;
    }

    // Fix: Add check for text-based channel before attempting to use .send() or other channel-specific methods.
    if (!message.channel.isTextBased()) {
        console.warn(`Adventure message received in non-text-based channel: ${message.channelId}. Aborting further processing for this message.`);
        // Try to inform the user, but this might also fail depending on the channel type and permissions.
        message.reply("이 채널에서는 모험을 계속할 수 없습니다 (텍스트 기반 채널 또는 권한 문제).").catch(e => console.error("Failed to reply about non-text-based channel:", e));
        return;
    }
    // Now, message.channel is confirmed to be a TextBasedChannel.

    // Fix: Use message.content for player input
    const playerInput = message.content;

    // Fix: Use message.channel.send for sending messages
    let thinkingMessage: Message | null = null; // Declare here to be accessible in catch/finally

    try {
      // This is now safer due to the isTextBased() check above.
      thinkingMessage = await message.channel.send("🤔 GM이 다음 이야기를 구상 중입니다... 잠시만 기다려주세요!");

      const nextMessage = await continueAdventureScenario(
        adventureSession.chat,
        playerInput,
        adventureSession.currentTurn,
        adventureSession.maxTurns
      );

      adventureSession.storyLog.push(`**플레이어 (${adventureSession.currentTurn}/${adventureSession.maxTurns}):** ${playerInput}`);
      adventureSession.storyLog.push(`**GM (${adventureSession.currentTurn}/${adventureSession.maxTurns}):** ${nextMessage}`);
      adventureSession.currentTurn += 1;
      
      if (thinkingMessage) { // Check if message was created before trying to delete
        await thinkingMessage.delete();
      }
      // Fix: Use message.reply or message.channel.send
      await message.reply(nextMessage);

      if (adventureSession.currentTurn > adventureSession.maxTurns) {
        client.activeAdventures.delete(userId); // 모험 종료 후 세션 삭제
        // await message.channel.send("모험이 모두 종료되었습니다! 새로운 모험을 시작하려면 `/모험시작`을 입력해주세요."); // 이미 continueAdventureScenario 에서 종료 메시지 포함
      } else {
        client.activeAdventures.set(userId, adventureSession); // 업데이트된 세션 저장
      }

    } catch (error) {
      console.error("모험 진행 중 오류 발생:", error);
      if (thinkingMessage) { // Attempt to delete thinking message even if an error occurred later
        try {
          await thinkingMessage.delete();
        } catch (deleteError) {
          console.error("Failed to delete thinking message during error handling:", deleteError);
        }
      }
      let errorMessage = '이야기를 이어가는 데 실패했습니다. 잠시 후 다시 시도해주세요.';
       if (error instanceof Error && error.message.includes('SAFETY')) {
        errorMessage = "죄송합니다. 생성된 응답이 안전 기준을 위반하여 표시할 수 없습니다. 다른 행동을 시도해주세요.";
      } else if (error instanceof Error) {
        errorMessage += `\n오류: ${error.message}`;
      }
      // Fix: Use message.reply or message.channel.send
      await message.reply(errorMessage);
      // 오류 발생 시 모험 세션 유지 여부 결정 필요 (예: 특정 오류는 세션 종료)
      // client.activeAdventures.delete(userId); 
    }
  }
}