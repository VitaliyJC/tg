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

connectedUsers(bot);
addCode(bot);
listCode(bot);
deleteCode(bot);
deleteAllCode(bot);
deleteUser(bot);
listUser(bot);
showId(bot);
// registration(bot);

commandList(bot);

showErrors(bot, GrammyError, HttpError);

bot.start();
