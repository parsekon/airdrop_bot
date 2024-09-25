module.exports = {
    startOptions: {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Ready?", callback_data: "ready" },
            ],
          ],
        },
      }
}