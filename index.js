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

const restrictedCommand = (commandName, handler) => {
  bot.command(commandName, async (ctx) => {
    if (!isAuthorized(ctx)) {
      return; // Прекращаем выполнение, если пользователь не авторизован
    }
    await handler(bot);
  });
};

restrictedCommand("connected_users", connectedUsers);
restrictedCommand("add_code", addCode);
restrictedCommand("list_code", listCode);
restrictedCommand("delete_code", deleteCode);
restrictedCommand("delete_all_code", deleteAllCode);
restrictedCommand("delete_user", deleteUser);
restrictedCommand("list_user", listUser);
restrictedCommand("show_id", showId);

registration(bot);

commandList(bot);

showErrors(bot, GrammyError, HttpError);

bot.start();
