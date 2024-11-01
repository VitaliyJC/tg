import { exec } from "child_process";
import { UserController, CodeController } from "../controllers/index.js";

export const registration = (bot) => {
  // Приветственное сообщение
  bot.command("registration", (ctx) => {
    ctx.session.step = "awaitingCode"; // Устанавливаем начальный этап
    ctx.reply("Привет! Введите код доступа для регистрации.");
  });

  // Обработка кода доступа, логина и пароля
  bot.on("message:text", async (ctx) => {
    if (ctx.session.step === "awaitingCode") {
      const code = ctx.message.text.trim();
      const codeDocument = await CodeController.validateCode(code, true);

      if (codeDocument) {
        ctx.session.code = code;
        ctx.session.step = "awaitingUsername";
        ctx.reply("✅ Код доступа подтвержден. Введите желаемый логин.");
      } else {
        ctx.reply("❗Неверный или недействительный код доступа.");
      }
    } else if (ctx.session.step === "awaitingUsername") {
      const username = ctx.message.text.trim();

      // Проверяем уникальность логина
      const isUnique = await UserController.isUsernameUnique(username);
      if (isUnique) {
        ctx.session.username = username;
        ctx.session.step = "awaitingPassword"; // Переход к этапу ввода пароля
        ctx.reply("✅ Логин уникален. Введите пароль.");
      } else {
        ctx.reply(
          "❌ Этот логин уже используется. Пожалуйста, выберите другой."
        );
      }
    } else if (ctx.session.step === "awaitingPassword") {
      const tgId = ctx.from.id;
      const firstName = ctx.from.first_name ?? null;
      const usernameTg = ctx.from.username;
      const isPremium = ctx.from.is_premium;
      const username = ctx.session.username;
      const password = ctx.message.text.trim();
      const code = ctx.session.code;
      console.log(username);
      console.log(password);
      console.log(code);

      // Автоматизируем создание пользователя через ocpasswd с помощью expect
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

          ctx.session = {}; // Очистка данных текущего сеанса после завершения регистрации
        }
      });
    } else {
      ctx.reply("Неправильный порядок команд.");
    }
  });
};
