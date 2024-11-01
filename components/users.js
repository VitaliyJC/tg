import { exec } from "child_process";
import { UserController, CodeController } from "../controllers/index.js";
import { bot } from "../index.js";

export const registration = (ctx) => {
  bot.command("registration", (ctx) => {
    ctx.session.step = "awaitingCode";
    ctx.reply("Привет! Введите код доступа для регистрации.");
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.session.step === "awaitingCode") {
      const code = ctx.message.text.trim();
      try {
        const codeIsValid = await CodeController.validateCode(code, true);

        if (codeIsValid) {
          ctx.session.code = code;
          ctx.session.step = "awaitingUsername";
          ctx.reply("✅ Код доступа подтвержден. Введите желаемый логин.");
        } else {
          ctx.reply("❗Неверный или недействительный код доступа.");
        }
      } catch (error) {
        console.error("Ошибка при проверке кода:", error);
        ctx.reply("❗Произошла ошибка при проверке кода.");
      }
    } else if (ctx.session.step === "awaitingUsername") {
      // Остальная часть логики остаётся прежней
      const username = ctx.message.text.trim();
      const isUnique = await UserController.isUsernameUnique(username);
      if (isUnique) {
        ctx.session.username = username;
        ctx.session.step = "awaitingPassword";
        ctx.reply("✅ Логин уникален. Введите пароль.");
      } else {
        ctx.reply(
          "❌ Этот логин уже используется. Пожалуйста, выберите другой."
        );
      }
    } else if (ctx.session.step === "awaitingPassword") {
      // Остальная часть логики для обработки пароля и завершения регистрации
      const tgId = ctx.from.id;
      const firstName = ctx.from.first_name ?? null;
      const usernameTg = ctx.from.username ?? null;
      const isPremium = ctx.from.is_premium ?? null;
      const username = ctx.session.username;
      const password = ctx.message.text.trim();
      const code = ctx.session.code;
      const command = `./create_user.sh ${username} ${password}`;

      exec(command, async (error) => {
        if (error) {
          console.error(`❌ Ошибка при добавлении пользователя: ${error}`);
          ctx.reply("❌ Ошибка при добавлении пользователя.");
        } else {
          await UserController.addUser(
            tgId,
            firstName,
            usernameTg,
            isPremium,
            username,
            password,
            code
          );
          ctx.reply(
            `✅ Пользователь ${username} добавлен. Добро пожаловать в VPN!`
          );

          ctx.session = {};
        }
      });
    } else {
      ctx.reply("Неправильный порядок команд.");
    }
  });
};

// Просмотр id
export const showId = (bot) => {
  bot.command("id", async (ctx) => {
    const chatId = ctx.chat.id;
    await ctx.reply(`Ваш telegram ID: ${ctx.from.id}, наш чат id: ${chatId}`);
    console.log(ctx.chat);
  });
};
