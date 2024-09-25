require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const sequelize = require('./db');
const userModel = require('./models');

const token = process.env.TOKEN;

const bot = new TelegramApi(token, { polling: true });

let sentMessages = {};
let writeMessages = {};
let notABots = {};
let noYoutube = {};
const airdropStart = true;

bot.on("message", (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;

  const connectionToBd = async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
    } catch (error) {
      console.log("Подключение к БД не работает!", error);
    }
  }

  const start = async () => {
    if (airdropStart) {
      if (text === "/start" && !notABots[chatId]) {
        sentMessages[chatId] = await bot.sendMessage(
          chatId,
          `Hi, ${msg.from.username}! Welcome to our community, please first prove me that you are a human`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "I'm not a bot", callback_data: "human" },
                  { text: "I'm a bot", callback_data: "nothuman" },
                ],
              ],
            },
          }
        );
      }
    } else {
      bot.sendMessage(chatId, "Airdrop закончен!");
    }
    connectionToBd();
  };

  start();
});


bot.on("callback_query", async (msg) => {
  const data = msg.data;
  const chatId = msg.message.chat.id;

  if (data === "nothuman") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, "Try again", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "I'm not a bot", callback_data: "human" },
            { text: "I'm a bot", callback_data: "nothuman" },
          ],
        ],
      },
    });
  }

  if (data === "human") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    notABots[chatId] = true;
    bot.sendMessage(chatId, `👍 That's correct, ${msg.from.username}!
  
✍️  The first 1000 valid participants will be rewarded.

🏆  Total Airdrop Pool: 100,000,000 LUNARSPHINX 

🔵  Basic actions:

🔸 Join our Telegram group

🔸 Follow our Twitter 

🔸 Like and retweet the pinned post

🔵 Additional rewards:

🔸 Record a short video about the project, or how you make a token purchase. The video should be with sound. Post the video on your youtube.

🏆🏆 The first 100 people will receive rewards from $10 to $100 depending on the quality of the video.

🏆🏆🏆 3 participants will receive rewards of $100, 300, 500 for the best videos!`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Ready?", callback_data: "ready" },
          ],
        ],
      },
    })
  }

  if(data === "ready") {
    sentMessages[chatId] = await bot.sendMessage(chatId, 'Join our chat:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Telegram Chat", url: process.env.TELEGRAMGROUP }],
            [{text: "next step ➡️", callback_data: "twitter"}
          ],
        ],
      },
    })
  }

  if(data === "twitter") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, 'Join our Twitter:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Twitter", url: process.env.TWITTER },
          ],
          [
            {text: "⬅️ prev step", callback_data: "ready"},
            { text: "next step ➡️", callback_data: "retweet" }
          ]
        ],
      },
    })
  }

  if(data === "retweet") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, 'Make a retweet:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Pinned post", url: process.env.RETWEET },
          ],
          [
            {text: "⬅️ prev step", callback_data: "twitter"},
            { text: "next step ➡️", callback_data: "youtube" }
          ]
        ],
      },
    })
  }

  if(data === "youtube") {
    noYoutube[chatId] = false;
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, 'Have you made a video yet?', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Yep!",  callback_data: "submit"},
            { text: "Maybe later", callback_data: "submitNoYoutube" }
          ],
          [{text: "⬅️ prev step", callback_data: "retweet"}],
        ],
      },
    })
  }

  if(data === "submitNoYoutube") {
    noYoutube[chatId] = true;
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, `Take a video and come back! We'll wait for you.`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⬅️ prev step",  callback_data: "youtube"},
            { text: "No video",  callback_data: "submit"},
          ]
        ],
      },
    })
  }

  if(data === "submit") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, `Ok! Let's keep your contacts. Enter the link to your Twitter account:`);
    bot.once('message', async (msg) => {
      const userTwitter = msg.text;

      writeMessages[chatId] = await bot.sendMessage(chatId, `You have entered:: ${userTwitter}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "ok",  callback_data: "submitRetweet"},
            ]
          ],
        },
      });
    });
  }

  if(data === "submitRetweet") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    bot.deleteMessage(chatId, writeMessages[chatId].message_id);
    console.log("Messeges >>>", sentMessages[chatId], "Write >>>", writeMessages[chatId])
    sentMessages[chatId] = await bot.sendMessage(chatId, `Enter the link to your Retweet:`);
    bot.once('message',async (msg) => {
      const linkRetweet = msg.text;

      writeMessages[chatId] = await bot.sendMessage(chatId, `You have entered:: ${linkRetweet}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "ok",  callback_data: "submitWalletOrYoutube" },
            ]
          ],
        },
      });
    });
  }

  if (data === "submitWalletOrYoutube" && !noYoutube[chatId]) {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    bot.deleteMessage(chatId, writeMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, "Enter the link to your Youtube video:");
    bot.once('message', async (msg) => {
      const linkYoutubeVideo = msg.text;

      writeMessages[chatId] = await bot.sendMessage(chatId, `You have entered: ${linkYoutubeVideo}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "ok",  callback_data: "submitAddressWallet" },
            ]
          ],
        },
      })
    })
  }

  if ((data === "submitAddressWallet") || (noYoutube[chatId] && data === "submitWalletOrYoutube")) {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    bot.deleteMessage(chatId, writeMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, `Enter your ${process.env.CHAIN} wallet:`);
    bot.once('message', async (msg) => {
      const addressWallet = msg.text;

      writeMessages[chatId] = await bot.sendMessage(chatId, `You have entered: ${addressWallet}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "ok",  callback_data: "submitAll" },
            ]
          ],
        },
      })
    })
  }

  if (data === "submitAll") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    bot.sendMessage(chatId, `Congratulations, you will be one of the first to receive tokens!`);
  }
});
