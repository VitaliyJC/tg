import { exec } from "child_process";
import { UserController, CodeController } from "../controllers/index.js";

// Команда для проверки подключенных клиентов
export const connectedUsers = (bot) => {
  bot.command("connected_users", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const username = args[0];

    if (username) {
      // Если указан username, выполняем команду для конкретного пользователя в формате JSON
      exec(`occtl --json show user ${username}`, (error, stdout, stderr) => {
        if (error || stderr) {
          console.error(`❌ Ошибка при выполнении команды: ${error || stderr}`);
          ctx.reply(
            `❌ Не удалось получить статус для пользователя ${username}.`
          );
          return;
        }

        // Парсим JSON-ответ и проверяем, что он содержит данные
        const userInfo = JSON.parse(stdout);
        if (!userInfo || userInfo.length === 0) {
          ctx.reply(`❌ Пользователь ${username} не найден или не подключен.`);
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
          console.error(`❌ Ошибка при выполнении команды: ${error || stderr}`);
          ctx.reply("❌ Не удалось получить список подключенных клиентов.");
          return;
        }

        // Парсим JSON-ответ и обрабатываем данные
        const users = JSON.parse(stdout);
        if (users.length === 0) {
          ctx.reply("🚷 Нет подключенных клиентов.");
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
};

// Команда для добавления кода доступа
export const addCode = (bot) => {
  bot.command("add_code", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);

    if (args.length < 2) {
      return ctx.reply(
        "❗Пожалуйста, укажите код доступа и срок действия в днях.\nПример: /addcode mycode 7"
      );
    }

    const code = args[0];
    const days = parseInt(args[1]);

    if (isNaN(days)) {
      return ctx.reply(
        "❗Срок действия должен быть числом, указывающим количество дней."
      );
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    try {
      await CodeController.addCode(code, expiryDate);
      ctx.reply(
        `✅ Добавлен код доступа: ${code}, срок действия: ${days} дней (до ${expiryDate.toDateString()})`
      );
    } catch (error) {
      console.error("❌ Ошибка при добавлении кода доступа:", error);
      ctx.reply("❌ Ошибка при добавлении кода доступа. Попробуйте снова.");
    }
  });
};

// Команда для просмотра всех кодов доступа
export const listCode = (bot) => {
  bot.command("list_codes", async (ctx) => {
    try {
      const codes = await CodeController.getAllCodes();

      if (codes.length === 0) {
        return ctx.reply("⚠ Нет доступных кодов.");
      }

      const checkStatus = (status) => {
        switch (status) {
          case "activated":
            return "Активирован 🔴";

          case "pending":
            return "Активен 🟢";

          case "expired":
            return "Истек 🔴";

          default:
            return "Неизвестен ❌";
        }
      };

      const codeList = codes
        .map((code) => {
          const status = checkStatus(code.status);
          return `Код: ${code.code}, действителен до: ${new Date(
            code.expiryDate
          ).toLocaleDateString("ru-RU")}, статус: ${status}`;
        })
        .join("\n");

      ctx.reply(`Список кодов доступа:\n${codeList}`);
    } catch (error) {
      console.error("❌ Ошибка при получении кодов доступа:", error);
      ctx.reply("❌ Ошибка при получении списка кодов доступа.");
    }
  });
};

// Команда для удаления определенного кода
export const deleteCode = (bot) => {
  bot.command("delete_code", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const code = args[0];

    if (!code) {
      return ctx.reply(
        "❗Пожалуйста, укажите код, который нужно удалить.\nПример: /deletecode mycode"
      );
    }

    try {
      const success = await CodeController.deleteCode(code);
      if (success) {
        ctx.reply(`✅ Код доступа '${code}' был успешно удален.`);
      } else {
        ctx.reply(`❗Код доступа '${code}' не найден.`);
      }
    } catch (error) {
      console.error("❌ Ошибка при удалении кода доступа:", error);
      ctx.reply("❌ Ошибка при удалении кода доступа. Попробуйте снова.");
    }
  });
};

// Команда для удаления всех кодов доступа
export const deleteAllCode = (bot) => {
  bot.command("delete_all_codes", async (ctx) => {
    try {
      const count = await CodeController.deleteAllCodes();
      ctx.reply(`✅ Удалено кодов доступа: ${count}`);
    } catch (error) {
      console.error("❌ Ошибка при удалении всех кодов доступа:", error);
      ctx.reply("❌ Ошибка при удалении всех кодов доступа. Попробуйте снова.");
    }
  });
};

// Команда для удаления пользователя
export const deleteUser = (bot) => {
  bot.command("delete_user", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    const username = args[0];

    if (!username) {
      return ctx.reply(
        "❗Пожалуйста, укажите имя пользователя для удаления.\nПример: /delete_user sever-test"
      );
    }

    try {
      const success = await UserController.deleteUser(username); // Вызов deleteUser для удаления из базы данных
      if (!success) {
        ctx.reply(`❗Пользователь ${username} не найден.`);
        return;
      }

      // Удаление пользователя из системы OpenConnect
      exec(
        `ocpasswd -d -c /etc/ocserv/clients/ocpasswd ${username}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Ошибка при удалении пользователя: ${error}`);
            ctx.reply(`❌ Не удалось удалить пользователя ${username}.`);
            return;
          }

          if (stderr) {
            console.error(`❌ Ошибка: ${stderr}`);
            ctx.reply(
              `❌ Ошибка при удалении пользователя ${username}: ${stderr}`
            );
            return;
          }

          ctx.reply(`✅ Пользователь ${username} успешно удален.`);
        }
      );
    } catch (error) {
      console.error(
        "❌ Ошибка при удалении пользователя из базы данных:",
        error
      );
      ctx.reply("❌ Ошибка при удалении пользователя. Попробуйте снова.");
    }
  });
};

// Просмотр всех зарегистрированных пользователей
export const listUser = (bot) => {
  bot.command("list_users", async (ctx) => {
    try {
      const users = await UserController.getAllUsers();

      if (users.length === 0) {
        ctx.reply("❗Нет зарегистрированных пользователей.");
      } else {
        const userList = users
          .map(
            (user) => `Имя пользователя: ${user.username} - ${user.status} 🟢`
          )
          .join("\n");
        ctx.reply(`Зарегистрированные пользователи:\n\n${userList}`);
      }
    } catch (error) {
      console.error("❌ Ошибка при получении списка пользователей:", error);
      ctx.reply("❌ Не удалось получить список пользователей.");
    }
  });
};

export const showId = (bot) => {
  bot.command("id", async (ctx) => {
    await ctx.reply(`Ваш telegram ID: ${ctx.from.id}`);
    console.log(ctx.from);
  });
};
