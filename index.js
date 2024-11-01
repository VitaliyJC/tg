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
    await next(); // если пользователь админ, продолжаем выполнение команды
  }
};

// Функция для подключения ограниченной команды
const restrictedCommand = (commandName, handler) => {
  bot.command(commandName, adminMiddleware, handler);
};

// Подключаем ограниченные команды
restrictedCommand("connected_users", (ctx) => connectedUsers(bot, ctx));
restrictedCommand("add_code", (ctx) => addCode(bot, ctx));
restrictedCommand("list_code", (ctx) => listCode(bot, ctx));
restrictedCommand("delete_code", (ctx) => deleteCode(bot, ctx));
restrictedCommand("delete_all_codes", (ctx) => deleteAllCode(bot, ctx));
restrictedCommand("delete_user", (ctx) => deleteUser(bot, ctx));
restrictedCommand("list_user", (ctx) => listUser(bot, ctx));
restrictedCommand("show_id", (ctx) => showId(bot, ctx));

// registration(bot);

commandList(bot);

showErrors(bot, GrammyError, HttpError);

bot.start();
