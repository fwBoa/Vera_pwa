import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const token = process.env.TELEGRAM_BOT_TOKEN;

export function initTelegramBot() {
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN manquant dans .env');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });
  console.log('🤖 Bot Telegram lancé ! En attente de messages...');

  bot.on('message', async (msg) => {
    console.log('Message reçu :', JSON.stringify(msg, null, 2));
    const chatId = msg.chat.id;

    try {
      await bot.sendMessage(chatId, '🔎 Vera analyse votre message...');

      //
      // 🔥 TEXTE
      //
      if (msg.text) {
        const res = await axios.post('http://localhost:3000/api/analyze', {
          type: 'text',
          content: msg.text,
          userId: `telegram-${chatId}`,
        });

        const output =
          res.data.reply ||
          res.data.result ||
          JSON.stringify(res.data, null, 2);

        return bot.sendMessage(chatId, output);
      }

      //
      // 🔥 PHOTO
      //
      if (msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const file = await bot.getFile(fileId);

        if (!file.file_path) {
          return bot.sendMessage(
            chatId,
            '❌ Impossible de récupérer la photo.'
          );
        }

        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

        const res = await axios.post('http://localhost:3000/api/analyze', {
          type: 'image',
          content: fileUrl,
          userId: `telegram-${chatId}`,
        });

        const output =
          res.data.reply ||
          res.data.result ||
          JSON.stringify(res.data, null, 2);

        return bot.sendMessage(chatId, output);
      }

      //
      // 🔥 VIDÉO
      //
      if (msg.video) {
        const fileId = msg.video.file_id;
        const file = await bot.getFile(fileId);

        if (!file.file_path) {
          return bot.sendMessage(
            chatId,
            '❌ Impossible de récupérer la vidéo.'
          );
        }

        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

        const res = await axios.post('http://localhost:3000/api/analyze', {
          type: 'video',
          content: fileUrl,
          userId: `telegram-${chatId}`,
        });

        const output =
          res.data.reply ||
          res.data.message ||
          JSON.stringify(res.data, null, 2);

        return bot.sendMessage(chatId, output);
      }

      //
      // 🔥 Contenu NON SUPPORTE
      //
      return bot.sendMessage(
        chatId,
        'Désolé, je ne comprends pas ce type de contenu.'
      );
    } catch (err: any) {
      console.log('--- DÉBUT LOG ERREUR AXIOS ---');
      console.error(
        '❌ Erreur sur appel /analyze :',
        err.response?.data || err
      );
      console.log('--- FIN LOG ERREUR AXIOS ---');
      bot.sendMessage(
        chatId,
        "❌ Erreur lors de l'analyse. (API ou serveur indisponible)"
      );
    }
  });
}
