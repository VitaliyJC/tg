import { Bot, session } from "grammy";
import { freeStorage } from "@grammyjs/storage-free";
import { exec } from "child_process";
import mongoose from "mongoose";

import { config } from "./config.js";
import { UserController, CodeController } from "./controllers/index.js";

mongoose
  .connect(config.db_api, { authSource: "admin" })
  .then(() => {
    console.log("Connected to MongoDB with authentication");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
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

// Команда для проверки подключенных клиентов
bot.command("connected_users", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const username = args[0];

  if (username) {
    // Если указан username, выполняем команду для конкретного пользователя в формате JSON
    exec(`occtl --json show user ${username}`, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(`Ошибка при выполнении команды: ${error || stderr}`);
        ctx.reply(`Не удалось получить статус для пользователя ${username}.`);
        return;
      }

      // Парсим JSON-ответ и проверяем, что он содержит данные
      const userInfo = JSON.parse(stdout);
      if (!userInfo || userInfo.length === 0) {
        ctx.reply(`Пользователь ${username} не найден или не подключен.`);
        return;
      }

      // Извлекаем информацию о пользователе из первого элемента массива
      const user = userInfo[0];
      const {
        ID,
        Username,
        "Remote IP": remoteIP,
        IPv4,
        "User-Agent": userAgent,
        RX,
        TX,
        "Connected at": connectedAt,
        State,
        "_Connected at": connectedDuration,
      } = user;
      const message = `Статус пользователя ${Username}:\n\nСостояние: ${State}\nID: ${ID}\nIP: ${remoteIP}\nVPN IP: ${IPv4}\nUser-Agent: ${userAgent}\nПолучено: ${RX} байт\nОтправлено: ${TX} байт\nПодключен с: ${connectedAt}\nПодключен на протяжении: ${connectedDuration}`;
      ctx.reply(message);
    });
  } else {
    // Если username не указан, выводим всех подключенных клиентов в формате JSON
    exec("occtl --json show users", (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(`Ошибка при выполнении команды: ${error || stderr}`);
        ctx.reply("Не удалось получить список подключенных клиентов.");
        return;
      }

      // Парсим JSON-ответ и обрабатываем данные
      const users = JSON.parse(stdout);
      if (users.length === 0) {
        ctx.reply("Нет подключенных клиентов.");
        return;
      }

      const userInfo = users
        .map((user) => {
          const {
            ID,
            Username,
            "Remote IP": remoteIP,
            IPv4,
            "User-Agent": userAgent,
            RX,
            TX,
            "Connected at": connectedAt,
            State,
          } = user;
          return `ID: ${ID}\nПользователь: ${Username}\nIP: ${remoteIP}\nVPN IP: ${IPv4}\nUser-Agent: ${userAgent}\nПолучено: ${RX} байт\nОтправлено: ${TX} байт\nПодключен с: ${connectedAt}\nСостояние: ${State}\n\n`;
        })
        .join("\n");

      ctx.reply(`Подключенные клиенты:\n\n${userInfo}`);
    });
  }
});

// Команда для добавления кода доступа
bot.command("addcode", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);

  if (args.length < 2) {
    return ctx.reply(
      "Пожалуйста, укажите код доступа и срок действия в днях.\nПример: /addcode mycode 7"
    );
  }

  const code = args[0];
  const days = parseInt(args[1]);

  if (isNaN(days)) {
    return ctx.reply(
      "Срок действия должен быть числом, указывающим количество дней."
    );
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  try {
    await CodeController.addCode(code, expiryDate);
    ctx.reply(
      `Добавлен код доступа: ${code}, срок действия: ${days} дней (до ${expiryDate.toDateString()})`
    );
  } catch (error) {
    console.error("Ошибка при добавлении кода доступа:", error);
    ctx.reply("Ошибка при добавлении кода доступа. Попробуйте снова.");
  }
});

// Команда для просмотра всех кодов доступа
bot.command("listcodes", async (ctx) => {
  try {
    const codes = await CodeController.getAllCodes();

    if (codes.length === 0) {
      return ctx.reply("Нет доступных кодов.");
    }

    const codeList = codes
      .map((code) => {
        const status =
          new Date(code.expiryDate) > new Date() ? "Активен" : "Истек";
        return `Код: ${code.code}, Срок действия до: ${new Date(
          code.expiryDate
        ).toLocaleDateString()}, Статус: ${status}`;
      })
      .join("\n");

    ctx.reply(`Список кодов доступа:\n${codeList}`);
  } catch (error) {
    console.error("Ошибка при получении кодов доступа:", error);
    ctx.reply("Ошибка при получении списка кодов доступа.");
  }
});

// // Команда для удаления определенного кода
// bot.command("deletecode", async (ctx) => {
//   const args = ctx.message.text.split(" ").slice(1);
//   const code = args[0];

//   if (!code) {
//     return ctx.reply(
//       "Пожалуйста, укажите код, который нужно удалить.\nПример: /deletecode mycode"
//     );
//   }

//   try {
//     const success = await deleteCode(code);
//     if (success) {
//       ctx.reply(`Код доступа '${code}' был успешно удален.`);
//     } else {
//       ctx.reply(`Код доступа '${code}' не найден.`);
//     }
//   } catch (error) {
//     console.error("Ошибка при удалении кода доступа:", error);
//     ctx.reply("Ошибка при удалении кода доступа. Попробуйте снова.");
//   }
// });

// // Команда для удаления всех кодов доступа
// bot.command("deleteallcodes", async (ctx) => {
//   try {
//     const count = await deleteAllCodes();
//     ctx.reply(`Удалено кодов доступа: ${count}`);
//   } catch (error) {
//     console.error("Ошибка при удалении всех кодов доступа:", error);
//     ctx.reply("Ошибка при удалении всех кодов доступа. Попробуйте снова.");
//   }
// });

// bot.command("delete_user", async (ctx) => {
//   const args = ctx.message.text.split(" ").slice(1);
//   const username = args[0];

//   if (!username) {
//     return ctx.reply(
//       "Пожалуйста, укажите имя пользователя для удаления.\nПример: /delete_user sever-test"
//     );
//   }

//   try {
//     const success = await deleteUser(username); // Вызов deleteUser для удаления из базы данных
//     if (!success) {
//       ctx.reply(`Пользователь ${username} не найден.`);
//       return;
//     }

//     // Удаление пользователя из системы OpenConnect
//     exec(
//       `ocpasswd -d -c /etc/ocserv/clients/ocpasswd ${username}`,
//       (error, stdout, stderr) => {
//         if (error) {
//           console.error(`Ошибка при удалении пользователя: ${error}`);
//           ctx.reply(`Не удалось удалить пользователя ${username}.`);
//           return;
//         }

//         if (stderr) {
//           console.error(`Ошибка: ${stderr}`);
//           ctx.reply(`Ошибка при удалении пользователя ${username}: ${stderr}`);
//           return;
//         }

//         ctx.reply(`Пользователь ${username} успешно удален.`);
//       }
//     );
//   } catch (error) {
//     console.error("Ошибка при удалении пользователя из базы данных:", error);
//     ctx.reply("Ошибка при удалении пользователя. Попробуйте снова.");
//   }
// });

// // Просмотр всех зарегестрированных пользователей
// bot.command("list_users", async (ctx) => {
//   try {
//     const users = await getAllUsers();

//     console.log(users);

//     if (users.length === 0) {
//       ctx.reply("Нет зарегистрированных пользователей.");
//     } else {
//       const userList = users
//         .map((user) => `Имя пользователя: ${user.username}`)
//         .join("\n");
//       ctx.reply(`Зарегистрированные пользователи:\n\n${userList}`);
//     }
//   } catch (error) {
//     console.error("Ошибка при получении списка пользователей:", error);
//     ctx.reply("Не удалось получить список пользователей.");
//   }
// });

// // Приветственное сообщение
// bot.command("registration", (ctx) => {
//   ctx.session.step = "awaitingCode"; // Устанавливаем начальный этап
//   ctx.reply("Привет! Введите код доступа для регистрации.");
// });

// // Обработка кода доступа, логина и пароля
// bot.on("message:text", async (ctx) => {
//   if (ctx.session.step === "awaitingCode") {
//     const code = ctx.message.text.trim();

//     // Проверяем код доступа в базе данных
//     const user = await validateCode(code);

//     if (user) {
//       const expiryDate = new Date(user.expiryDate);
//       if (expiryDate > new Date()) {
//         ctx.session.code = code; // Сохраняем код в данных текущего сеанса
//         ctx.session.step = "awaitingUsername"; // Переход к следующему этапу
//         ctx.reply("Код доступа подтвержден. Введите желаемый логин.");
//       } else {
//         ctx.reply("Срок действия кода истек.");
//       }
//     } else {
//       ctx.reply("Неверный код доступа.");
//     }
//   } else if (ctx.session.step === "awaitingUsername") {
//     const username = ctx.message.text.trim();

//     // Проверяем уникальность логина
//     const isUnique = await isUsernameUnique(username);
//     if (isUnique) {
//       ctx.session.username = username;
//       ctx.session.step = "awaitingPassword"; // Переход к этапу ввода пароля
//       ctx.reply("Логин уникален. Введите пароль.");
//     } else {
//       ctx.reply("Этот логин уже используется. Пожалуйста, выберите другой.");
//     }
//   } else if (ctx.session.step === "awaitingPassword") {
//     const password = ctx.message.text.trim();
//     const username = ctx.session.username;
//     const code = ctx.session.code;

//     // Автоматизируем создание пользователя через ocpasswd с помощью expect
//     const command = `./create_user.sh ${username} ${password}`;

//     exec(command, async (error) => {
//       if (error) {
//         console.error(`Ошибка при добавлении пользователя: ${error}`);
//         ctx.reply("Ошибка при добавлении пользователя.");
//       } else {
//         await addUser(code, username, password);
//         ctx.reply("Пользователь добавлен. Добро пожаловать в VPN!");

//         ctx.session = {}; // Очистка данных текущего сеанса после завершения регистрации
//       }
//     });
//   } else {
//     ctx.reply("Неправильный порядок команд.");
//   }
// });

// Логирование ошибок
bot.catch((err) => {
  console.error("Произошла ошибка:", err);
});

// bot.api.setMyCommands([
//   {
//     command: "connected_users",
//     description: "Проверка активных пользователей",
//   },
//   { command: "addcode", description: "Добавить код доступа" },
//   { command: "listcodes", description: "Показать все коды доступа" },
//   { command: "deletecode", description: "Удалить код доступа" },
//   { command: "deleteallcodes", description: "Удалить все коды доступа" },
//   { command: "delete_user", description: "Удалить пользователя" },
//   {
//     command: "list_users",
//     description: "Показать зарегестрированных пользователей",
//   },
//   { command: "registration", description: "Зарегестрироваться" },
// ]);

bot.start();
