import { ChatGPTAPI } from 'chatgpt'
import 'dotenv/config'
import { Client, GatewayIntentBits, REST } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import { SlashCommandBuilder } from '@discordjs/builders';
import TelegramBot from 'node-telegram-bot-api'

const { env: { OPENAI_API_KEY, D_TOKEN, D_CLIENT_ID, T_TOKEN } } = process;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName('send')
    .setDescription('Отправить сообщение')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Сообщение')
        .setRequired(true),
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(D_TOKEN);
const api = new ChatGPTAPI({ apiKey: OPENAI_API_KEY });

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(D_CLIENT_ID),
      { body: commands },
    );
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  if (commandName === 'send') {
    try {
      const message = interaction.options.getString('message');
      await interaction.deferReply();
      const res = await api.sendMessage(message);
      await interaction.editReply(`Вопрос: ${message};\n Ответ GPT: ${res.text}`);
    } catch (err){
      console.log(err)
    }
  }
});
client.login(D_TOKEN);

const POLLING_SETTINGS = {
  interval: 300,
  autoStart: true
}
const bot = new TelegramBot(T_TOKEN, {polling: POLLING_SETTINGS});
let chatIds = []

bot.onText(/\/start/, async (msg) => {
  const { chat: { id } } = msg
  chatIds.push(id)

  bot.sendMessage(id, 'Общайтесь')
})

bot.onText(/\/stop/, () => {
  chatIds = []
  bot.sendMessage(id, 'Очистка всех чатов')
})

bot.on('message', async (msg) => {
  const res = await api.sendMessage(msg.text);
  chatIds.forEach((chatId) => {
    bot.sendMessage(chatId, res.text);
  })
})