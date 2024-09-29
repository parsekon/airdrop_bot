require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const sequelize = require("./db");
const UserModel = require("./models");
const token = process.env.TOKEN;
const bot = new TelegramApi(token, { polling: true });

let sentMessages = {};
let writeMessages = {};
let notABots = {};
let noYoutube = {};
let airdropStart = true;

const adminId = process.env.ADMIN_ID;

// Команды администратора

bot.onText(/\/admincommand/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  console.log("User ID >>>", userId);

  if (userId.toString() === adminId) {
    bot.sendMessage(chatId, 'Вам доступно меню администратора', {
      reply_markup: {
        keyboard: [
          [{text: "Switch on"}, {text: "Switch off"}],
          [{text: "Statistics"}, {text: "Export Excel"}]
        ]
      }
    });
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  const countUsers = async () => {
    try {
      return await UserModel.count();
    } catch (error) {
      console.error(error);
    }
  }

  if(userId.toString() === adminId) {
    if(text === "Switch on") {
      airdropStart = true;
      return bot.sendMessage(chatId, "Airdrop включен");
    } else if (text === "Switch off") {
      airdropStart = false;
      return bot.sendMessage(chatId, "Airdrop выключен");
    } else if (text === "Statistics") {
      const countU = await countUsers();
      bot.sendMessage(chatId, `Количество пользователей: ${countU}`)
    }
  }
})

// Старт бота
bot.on("message", (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;

  const initDbConnection = async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      console.log("Соединение с БД установлено");
    } catch (error) {
      console.log("Не удалось подключиться к БД", error);
    }
  };

  initDbConnection();

  const start = async () => {
    if (airdropStart) {
      let user = await UserModel.findOne({
        where: { chatId: chatId.toString() },
      });

      if (!user) {
        user = await UserModel.create({
          chatId: chatId.toString(),
          telegram: msg.from.username,
        });
      }

      console.log("USER >>>", user);

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
  };

  start();
});

// Airdrop взаимодействие с пользователем
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  let user = await UserModel.findOne({
    where: { chatId: chatId.toString() },
  });

  if (text === "Social") {
    bot.sendMessage(
      chatId,
      `
      <b>Our official link ➡️</b>

      <b>🌎 Website:</b> http://lunar-sphinx.com

      <b>📱 Twitter:</> https://x.com/Lunar_Sphinx

      <b>🖨 Telegram:</b> @LunarSphinx777

      <b>💰 Token</b>: <a href="https://etherscan.io/token/0x108ce14704263c9e2db314e03929d5cf044756d3">0x108ce14704263c9e2db314e03929d5cf044756d3</a>
    `,
      {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }
    );
  } else if (text === "Airdrop") {
    bot.sendMessage(
      chatId,
      `
    <b>    📱 Your Twitter:</b> ${user.twitter}

    <b>📎 Your retweet:</b> ${user.retweet}

    <b>📺 Your video:</b> ${user.youtube ?? "no"}

    <b>💰 Your wallet:</b> <a href="https://etherscan.io/address/${user.wallet}">${user.wallet}</a>
    
    `,
      {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }
    );
  }


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
    bot.sendMessage(
      chatId,
      `👍 That's correct, ${msg.from.username}!
  
✍️  The first 1000 valid participants will be rewarded.

🏆  Total Airdrop Pool: 100,000,000 LUNARSPHINX 

🔵  Basic actions:

🔸 Join our Telegram group

🔸 Follow our Twitter 

🔸 Like and retweet the pinned post

🔵 Additional rewards:

🔸 Record a short video about the project, or how you make a token purchase. The video should be with sound. Post the video on your youtube.

🏆🏆 The first 100 people will receive rewards from $10 to $100 depending on the quality of the video.

🏆🏆🏆 3 participants will receive rewards of $100, 300, 500 for the best videos!`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Ready?", callback_data: "ready" }]],
        },
      }
    );
  }

  if (data === "ready") {
    sentMessages[chatId] = await bot.sendMessage(chatId, "Join our chat:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Telegram Chat", url: process.env.TELEGRAMGROUP }],
          [{ text: "next step ➡️", callback_data: "twitter" }],
        ],
      },
    });
  }

  if (data === "twitter") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, "Join our Twitter:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Twitter", url: process.env.TWITTER }],
          [
            { text: "⬅️ prev step", callback_data: "ready" },
            { text: "next step ➡️", callback_data: "retweet" },
          ],
        ],
      },
    });
  }

  if (data === "retweet") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(chatId, "Make a retweet:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Pinned post", url: process.env.RETWEET }],
          [
            { text: "⬅️ prev step", callback_data: "twitter" },
            { text: "next step ➡️", callback_data: "youtube" },
          ],
        ],
      },
    });
  }

  if (data === "youtube") {
    noYoutube[chatId] = false;
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(
      chatId,
      "Have you made a video yet?",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Yep!", callback_data: "submit" },
              { text: "Maybe later", callback_data: "submitNoYoutube" },
            ],
            [{ text: "⬅️ prev step", callback_data: "retweet" }],
          ],
        },
      }
    );
  }

  if (data === "submitNoYoutube") {
    noYoutube[chatId] = true;
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(
      chatId,
      `Take a video and come back! We'll wait for you.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⬅️ prev step", callback_data: "youtube" },
              { text: "No video", callback_data: "submit" },
            ],
          ],
        },
      }
    );
  }

  if (data === "submit") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(
      chatId,
      `Ok! Let's keep your contacts. Enter the link to your Twitter account:`
    );
    bot.once("message", async (msg) => {
      const userTwitter = msg.text;

      let user = await UserModel.findOne({
        where: { chatId: chatId.toString() },
      });

      if (user) {
        await user.update({ twitter: userTwitter });
      }

      console.log("USER_2 >>>", user);

      writeMessages[chatId] = await bot.sendMessage(
        chatId,
        `You have entered:: ${userTwitter}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "edit", callback_data: "submit" },
                { text: "ok", callback_data: "submitRetweet" },
              ],
            ],
          },
        }
      );
    });
  }

  if (data === "submitRetweet") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    bot.deleteMessage(chatId, writeMessages[chatId].message_id);

    sentMessages[chatId] = await bot.sendMessage(
      chatId,
      `Enter the link to your Retweet:`
    );
    bot.once("message", async (msg) => {
      const linkRetweet = msg.text;

      let user = await UserModel.findOne({
        where: { chatId: chatId.toString() },
      });

      if (user) {
        await user.update({ retweet: linkRetweet });
      }

      console.log("USER 3>>>", user);

      writeMessages[chatId] = await bot.sendMessage(
        chatId,
        `You have entered:: ${linkRetweet}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "edit", callback_data: "submitRetweet" },
                { text: "ok", callback_data: "submitWalletOrYoutube" },
              ],
            ],
          },
        }
      );
    });
  }

  if (data === "submitWalletOrYoutube" && !noYoutube[chatId]) {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    bot.deleteMessage(chatId, writeMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(
      chatId,
      "Enter the link to your Youtube video:"
    );
    bot.once("message", async (msg) => {
      const linkYoutubeVideo = msg.text;

      let user = await UserModel.findOne({
        where: { chatId: chatId.toString() },
      });

      if (user) {
        await user.update({ youtube: linkYoutubeVideo });
      }

      console.log("USER 3>>>", user);

      writeMessages[chatId] = await bot.sendMessage(
        chatId,
        `You have entered: ${linkYoutubeVideo}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "edit", callback_data: "submitWalletOrYoutube" },
                { text: "ok", callback_data: "submitAddressWallet" },
              ],
            ],
          },
        }
      );
    });
  }

  if (
    data === "submitAddressWallet" ||
    (noYoutube[chatId] && data === "submitWalletOrYoutube")
  ) {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);
    bot.deleteMessage(chatId, writeMessages[chatId].message_id);
    sentMessages[chatId] = await bot.sendMessage(
      chatId,
      `Enter your ${process.env.CHAIN} wallet:`
    );
    bot.once("message", async (msg) => {
      const addressWallet = msg.text;

      let user = await UserModel.findOne({
        where: { chatId: chatId.toString() },
      });

      if (user) {
        await user.update({ wallet: addressWallet });
      }

      console.log("USER 4 >>>", user);

      writeMessages[chatId] = await bot.sendMessage(
        chatId,
        `You have entered: ${addressWallet}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "edit", callback_data: "submitAddressWallet" },
                { text: "ok", callback_data: "submitAll" },
              ],
            ],
          },
        }
      );
    });
  }

  if (data === "submitAll") {
    bot.deleteMessage(chatId, sentMessages[chatId].message_id);

    let user = await UserModel.findOne({
      where: { chatId: chatId.toString() },
    });

    bot.sendMessage(
      chatId,
      `🎉🎉🎉 <b>Congratulations</b>,

    You will be one of the first to receive tokens!

    <b>Your Twitter:</b> <a href="${user.twitter}">${user.twitter}</a>
    
    <b>Your Retweet:</b> <a href="${user.retweet}">${user.retweet}</a>

    <b>Your Video:</b> ${
      user.youtube
        ? `<a href="${user.youtube}">${user.youtube}</a>`
        : "No video"
    }

    <b>Your Wallet:</b> <a href="https://etherscan.io/address/${user.wallet}">${user.wallet}</a>
    `,
      {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          keyboard: [
            [{ text: "Social" }], [{ text: "Airdrop" }]
        ],
          resize_keyboard: true,
        },
      }
    );
  }
});
