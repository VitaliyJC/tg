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
const ADMIN_IDS = [405034143, 123456789];

// Middleware для проверки админ-доступа
const adminMiddleware = async (ctx, next) => {
  console.log(`Проверка доступа для пользователя ${ctx.from.id}`);
  if (ctx.from && ADMIN_IDS.includes(ctx.from.id)) {
    await next();
  } else {
    await ctx.reply("⛔ У вас нет доступа к этой команде.");
  }
};

bot.command("start", (ctx) => ctx.reply("Бот активен и получает команды"));

bot.command("connected_users", adminMiddleware, (ctx) => connectedUsers(ctx));
bot.command("add_code", adminMiddleware, (ctx) => addCode(ctx));
bot.command("list_codes", adminMiddleware, (ctx) => listCode(ctx));
bot.command("delete_code", adminMiddleware, (ctx) => deleteCode(ctx));
bot.command("delete_all_codes", adminMiddleware, (ctx) => deleteAllCode(ctx));
bot.command("delete_user", adminMiddleware, (ctx) => deleteUser(ctx));
bot.command("list_users", adminMiddleware, (ctx) => listUser(ctx));
bot.command("show_id", adminMiddleware, (ctx) => showId(ctx));
// registration(bot);

commandList(bot);

showErrors(bot, GrammyError, HttpError);

bot.start();
