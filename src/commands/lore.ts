import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, LoreEntry } from '../types';
import { loreData } from '../data/loreData'; // 실제 세계관 데이터 경로

export const lore: Command = {
  data: new SlashCommandBuilder()
    .setName('세계관')
    .setDescription('"Usual Saviors" 세계관의 용어 설명을 보여줍니다.')
    .addStringOption(option =>
      option.setName('용어')
        .setDescription('설명을 보고 싶은 용어를 입력하세요. (예: 이형, 신족)')
        .setRequired(true)
        .setAutocomplete(true)), // 자동완성 활성화
  async execute(interaction: ChatInputCommandInteraction) {
    const searchTerm = interaction.options.getString('용어', true).toLowerCase();
    const entry = loreData.find(e => 
        e.term.toLowerCase() === searchTerm || 
        (e.aliases && e.aliases.some(alias => alias.toLowerCase() === searchTerm))
    );

    if (!entry) {
      // 유사 용어 추천 기능 (간단 버전)
      const similarTerms = loreData
        .filter(e => e.term.toLowerCase().includes(searchTerm) || (e.aliases && e.aliases.some(alias => alias.toLowerCase().includes(searchTerm))))
        .slice(0, 5) // 최대 5개 추천
        .map(e => e.term);

      let replyMessage = `😥 해당 용어 "${interaction.options.getString('용어', true)}"에 대한 정보를 찾을 수 없습니다.`;
      if (similarTerms.length > 0) {
        replyMessage += `\n혹시 이런 용어를 찾으셨나요? \`${similarTerms.join('`, `')}\``;
      } else {
        replyMessage += `\n\`/세계관\` 명령어 뒤에 정확한 용어를 입력하거나, 사용 가능한 용어 목록을 확인해보세요. (목록 기능은 추후 추가될 수 있습니다.)`;
      }
      await interaction.reply({ content: replyMessage, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2) // Discord Blurple
      .setTitle(`📖 세계관 정보: ${entry.term}`)
      .setDescription(entry.description)
      .setTimestamp();

    if (entry.aliases && entry.aliases.length > 0) {
      embed.addFields({ name: '관련 용어/별칭', value: entry.aliases.join(', ') });
    }
    if (entry.category) {
      embed.addFields({ name: '분류', value: entry.category });
    }
    
    // 자동완성 제안이 있었던 경우, 사용자가 선택한 정확한 용어로 표시
    const displayTerm = interaction.options.getString('용어', true);
    if (entry.term !== displayTerm && entry.aliases?.includes(displayTerm)) {
        embed.setFooter({text: `"${displayTerm}"(으)로 검색하셨습니다.`});
    }


    await interaction.reply({ embeds: [embed] });
  },
};

// 자동완성 핸들러 (bot.ts에서 호출)
export async function handleLoreAutocomplete(interaction: import('discord.js').AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const filtered = loreData.filter(choice => 
        choice.term.toLowerCase().startsWith(focusedValue) ||
        (choice.aliases && choice.aliases.some(alias => alias.toLowerCase().startsWith(focusedValue)))
    ).slice(0, 25); // Discord 자동완성은 최대 25개

    await interaction.respond(
        filtered.map(choice => ({ name: choice.term, value: choice.term })),
    );
}
