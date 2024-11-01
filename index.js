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

// Middleware для проверки авторизации
const adminMiddleware = async (ctx, next) => {
  const adminId = 405034143;
  if (ctx.from?.id === adminId) {
    await next(); // если пользователь админ, продолжаем выполнение команды
  }
  // Неавторизованные пользователи не получат ответ
};

// Ограниченные команды с middleware для проверки админа
bot.command("connected_users", adminMiddleware, connectedUsers);
bot.command("add_code", adminMiddleware, addCode);
bot.command("list_code", adminMiddleware, listCode);
bot.command("delete_code", adminMiddleware, deleteCode);
bot.command("delete_all_codes", adminMiddleware, deleteAllCode);
bot.command("delete_user", adminMiddleware, deleteUser);
bot.command("list_user", adminMiddleware, listUser);
bot.command("show_id", adminMiddleware, showId);

registration(bot);

commandList(bot);

showErrors(bot, GrammyError, HttpError);

bot.start();
