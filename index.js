import { Bot, session } from "grammy";
import { freeStorage } from "@grammyjs/storage-free";
import { exec } from "child_process";
import mongoose from "mongoose";

import { config } from "./config.js";
import { UserController, CodeController } from "./controllers/index.js";
import {
  connectedUsers,
  addCode,
  listCode,
  deleteCode,
  deleteAllCode,
  deleteUser,
  listUser,
  showId,
} from "./components/admin.js";

mongoose
  .connect(config.db_api, { authSource: "admin" })
  .then(() => {
    console.log("✅ Connected to MongoDB with authentication");
  })
  .catch((error) => {
    console.log("❌ Error connecting to MongoDB:", error);
  });

// Инициализация бота
const bot = new Bot(config.telegram_api);

// Подключаем сессии с использованием freeStorage и передаем токен
bot.use(
  session({
    initial: () => ({ step: "awaitingCode" }), // Устанавливаем начальный этап сессии
    storage: freeStorage(bot.token), // Передаем токен для работы freeStorage
  })
);

connectedUsers(bot);
addCode(bot);
listCode(bot);
deleteCode(bot);
deleteAllCode(bot);
deleteUser(bot);
listUser(bot);
showId(bot);

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
      ctx.reply("❌ Этот логин уже используется. Пожалуйста, выберите другой.");
    }
  } else if (ctx.session.step === "awaitingPassword") {
    const password = ctx.message.text.trim();
    const username = ctx.session.username;
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
        await UserController.addUser(username, password, code);
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

// Логирование ошибок
bot.catch((err) => {
  console.error("❗Произошла ошибка:", err);
});

bot.api.setMyCommands([
  {
    command: "connected_users",
    description: "Проверка активных пользователей",
  },
  { command: "add_code", description: "Добавить код доступа" },
  { command: "list_codes", description: "Показать все коды доступа" },
  { command: "delete_code", description: "Удалить код доступа" },
  { command: "delete_all_codes", description: "Удалить все коды доступа" },
  { command: "delete_user", description: "Удалить пользователя" },
  {
    command: "list_users",
    description: "Показать зарегистрированных пользователей",
  },
  { command: "registration", description: "Зарегистрироваться" },
]);

bot.start();
