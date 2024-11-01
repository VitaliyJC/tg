export const commandList = (bot, adminId) => {
  // Команды, доступные всем пользователям
  const userCommands = [
    { command: "registration", description: "Зарегистрироваться" },
    { command: "id", description: "Показать Ваш ID" },
  ];

  // Команды, доступные только админу в приватных чатах
  const adminCommands = [
    { command: "add_code", description: "Добавить код доступа" },
    { command: "list_codes", description: "Показать все коды доступа" },
    { command: "delete_code", description: "Удалить код доступа" },
    {
      command: "connected_users",
      description: "Проверка активных пользователей",
    },
    {
      command: "list_users",
      description: "Показать зарегистрированных пользователей",
    },
    { command: "delete_user", description: "Удалить пользователя" },
    { command: "delete_all_codes", description: "Удалить все коды доступа" },
  ];

  // Устанавливаем команды для всех пользователей
  bot.api.setMyCommands(userCommands, {
    scope: { type: "all_private_chats" },
  });

  // Устанавливаем команды для администратора в приватных чатах
  bot.api.setMyCommands(adminCommands, {
    scope: { type: "chat", chat_id: adminId },
  });
};
