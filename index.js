import { Bot, session, GrammyError, HttpError } from "grammy";
import { freeStorage } from "@grammyjs/storage-free";
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
  showId,
} from "./components/admin.js";
import { registration } from "./components/users.js";
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

// Подключаем сессии с использованием freeStorage и передаем токен
bot.use(
  session({
    initial: () => ({ step: "awaitingCode" }), // Устанавливаем начальный этап сессии
    storage: freeStorage(bot.token), // Передаем токен для работы freeStorage
  })
);

// ID администратора
const ADMIN_ID = 405034143;

// Middleware для проверки авторизации
const adminMiddleware = async (ctx, next) => {
  if (ctx.from?.id === ADMIN_ID) {
    console.log("✅ Администратор"); // Для отладки
    await next(); // если пользователь админ, продолжаем выполнение команды
  } else {
    console.log("⛔ Не авторизован"); // Для отладки
  }
};

// Подключение команд с проверкой администратора
bot.command("connected_users", adminMiddleware, (ctx) =>
  connectedUsers(bot, ctx)
);
bot.command("add_code", adminMiddleware, (ctx) => addCode(bot, ctx));
bot.command("list_code", adminMiddleware, (ctx) => listCode(bot, ctx));
bot.command("delete_code", adminMiddleware, (ctx) => deleteCode(bot, ctx));
bot.command("delete_all_codes", adminMiddleware, (ctx) =>
  deleteAllCode(bot, ctx)
);
bot.command("delete_user", adminMiddleware, (ctx) => deleteUser(bot, ctx));
bot.command("list_user", adminMiddleware, (ctx) => listUser(bot, ctx));
bot.command("show_id", adminMiddleware, (ctx) => showId(bot, ctx));

// registration(bot);

commandList(bot);

showErrors(bot, GrammyError, HttpError);

bot.start();
