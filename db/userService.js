import { db } from "./database.js";

// Функции для работы с коллекцией users
export async function addUser(code, username, password) {
  const collection = db.collection("users");
  const res = await collection.insertOne({
    code,
    username,
    password,
    status: "active",
  });
  console.log("Добавлен пользователь:", res);
}

export async function getAllUsers() {
  const collection = db.collection("users");
  return await collection.find({}).toArray();
}

export async function deleteUser(username) {
  const collection = db.collection("users");
  const result = await collection.deleteOne({ username: username }); // Явное указание условия удаления
  console.log("Удаление пользователя:", result);
  return result.deletedCount > 0;
}

export async function isUsernameUnique(username) {
  const collection = db.collection("users");
  const user = await collection.findOne({ username });
  return !user; // Возвращает true, если логин уникален
}
