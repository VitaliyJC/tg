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

// Проверка авторизации
const isAuthorized = (ctx) => ctx.from.id === 405034143;

// Функция для ограничения доступа к командам
const restrictedCommand = (bot, commandName, handler) => {
  bot.command(commandName, (ctx) => {
    if (isAuthorized(ctx)) {
      return handler(ctx);
    }
    // Неавторизованным пользователям не отвечаем
  });
};

// Ограниченные команды
restrictedCommand(bot, "connected_users", connectedUsers);
restrictedCommand(bot, "add_code", addCode);
restrictedCommand(bot, "list_code", listCode);
restrictedCommand(bot, "delete_code", deleteCode);
restrictedCommand(bot, "delete_all_codes", deleteAllCode);
restrictedCommand(bot, "delete_user", deleteUser);
restrictedCommand(bot, "list_user", listUser);
restrictedCommand(bot, "show_id", showId);

registration(bot);

commandList(bot);

showErrors(bot, GrammyError, HttpError);

bot.start();
