import { Bot, session, GrammyError, HttpError, Keyboard } from "grammy";
import { freeStorage } from "@grammyjs/storage-free";
import { limit } from "@grammyjs/ratelimiter";
import mongoose from "mongoose";

import { config } from "./config.js";
import {
  connectedUsers,
  addCode,
  listCode,
  deleteCode,
  deleteAllCode,
  deleteUser,
  listUser,
} from "./components/admin.js";
import { registration, showId } from "./components/users.js";
import { commandList } from "./components/commandList.js";
import { showErrors } from "./components/error.js";

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

bot.use(
  limit({
    timeFrame: 5000, // Время в миллисекундах
    limit: 3, // Количество запросов, разрешенных в указанный период
    onLimitExceeded: async (ctx) => {
      await ctx.reply(
        "⛔ Вы слишком часто отправляете запросы. Пожалуйста, подождите."
      );
    },
  })
);

// Подключаем сессии с использованием freeStorage и передаем токен
bot.use(
  session({
    initial: () => ({ step: "awaitingCode" }), // Устанавливаем начальный этап сессии
    storage: freeStorage(bot.token), // Передаем токен для работы freeStorage
  })
);

// ID администратора
const ADMIN_IDS = [405034143];

// Middleware для проверки админ-доступа
const adminMiddleware = async (ctx, next) => {
  console.log(`Проверка доступа для пользователя ${ctx.from.id}`);
  if (ctx.from && ADMIN_IDS.includes(ctx.from.id)) {
    await next();
  } else {
    await ctx.reply("⛔ У вас нет доступа к этой команде.");
  }
};

// Создаем клавиатуру
const keyboard = new Keyboard()
  .text("Старт")
  .row()
  .text("Список команд")
  .resized();

// Отправляем клавиатуру при команде `/start`
bot.command("start", (ctx) =>
  ctx.reply("Бот активен и получает команды", { reply_markup: keyboard })
);

// Обрабатываем нажатие на кнопку "Старт"
bot.hears("Старт", (ctx) => {
  ctx.reply("Вы нажали кнопку Старт.");
});

// Обрабатываем нажатие на кнопку "Список команд"
bot.hears("Список команд", (ctx) => {
  ctx.reply(
    "Доступные команды:\n/connected_users\n/add_code\n/list_codes\n..."
  );
});

bot.command("connected_users", adminMiddleware, (ctx) => connectedUsers(ctx));
bot.command("add_code", adminMiddleware, (ctx) => addCode(ctx));
bot.command("list_codes", adminMiddleware, (ctx) => listCode(ctx));
bot.command("delete_code", adminMiddleware, (ctx) => deleteCode(ctx));
bot.command("delete_all_codes", adminMiddleware, (ctx) => deleteAllCode(ctx));
bot.command("delete_user", adminMiddleware, (ctx) => deleteUser(ctx));
bot.command("list_users", adminMiddleware, (ctx) => listUser(ctx));

showId(bot);
registration(bot);

commandList(bot, ADMIN_IDS[0]);

showErrors(bot, GrammyError, HttpError);

bot.start();
