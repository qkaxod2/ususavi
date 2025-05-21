import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import { CharacterProfile, Command } from '../types';

export const character: Command = {
  data: new SlashCommandBuilder()
    .setName('캐릭터')
    .setDescription('캐릭터 프로필 관련 명령어입니다.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('생성')
        .setDescription('새로운 캐릭터 프로필을 생성합니다.')
        .addStringOption(option =>
          option.setName('이름')
            .setDescription('캐릭터의 이름을 입력하세요.')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('설명')
            .setDescription('캐릭터에 대한 간단한 설명을 입력하세요.')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('보기')
        .setDescription('자신의 캐릭터 프로필을 확인합니다.')),
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client as Client;
    const userId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '생성') {
      const name = interaction.options.getString('이름', true);
      const description = interaction.options.getString('설명', true);

      if (client.characterProfiles.has(userId)) {
        // 이미 프로필이 있는 경우 덮어쓸지 물어보거나, 수정 명령어를 안내할 수 있습니다.
        // 여기서는 간단하게 덮어쓰도록 처리합니다.
      }

      const newProfile: CharacterProfile = { id: userId, name, description };
      client.characterProfiles.set(userId, newProfile);

      await interaction.reply({
        content: `✅ 캐릭터 "${name}" 프로필이 성공적으로 생성/업데이트되었습니다!`,
        ephemeral: true,
      });
    } else if (subcommand === '보기') {
      const profile = client.characterProfiles.get(userId);

      if (!profile) {
        await interaction.reply({
          content: ' 아직 생성된 캐릭터 프로필이 없습니다. `/캐릭터 생성` 명령어로 먼저 프로필을 만들어주세요!',
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`✨ ${profile.name}님의 캐릭터 프로필 ✨`)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() || undefined })
        .addFields(
          { name: '📝 이름', value: profile.name },
          { name: '📖 설명', value: profile.description }
          // 필요시 더 많은 필드 추가
        )
        .setTimestamp()
        .setFooter({ text: 'Usual Saviors RPG Helper' });

      await interaction.reply({ embeds: [embed] });
    }
  },
};
