export const commandList = (bot) => {
  bot.api.setMyCommands([
    {
      command: "connected_users",
      description: "Проверка активных пользователей",
    },
    { command: "add_code", description: "Добавить код доступа" },
    { command: "list_codes", description: "Показать все коды доступа" },
    { command: "delete_code", description: "Удалить код доступа" },
    { command: "delete_all_codes", description: "Удалить все коды доступа" },
    { command: "delete_user", description: "Удалить пользователя" },
    {
      command: "list_users",
      description: "Показать зарегистрированных пользователей",
    },
    { command: "registration", description: "Зарегистрироваться" },
  ]);
};
