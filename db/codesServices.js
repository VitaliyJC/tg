import { db } from "./database.js";

// Функции для работы с коллекцией codes
export async function addUserCode(code, expiryDate) {
  const collection = db.collection("codes");

  // Проверка на существование кода
  const existingCode = await collection.findOne({ code });
  if (existingCode) {
    throw new Error(
      `Код ${code} уже существует. Выберите другой код или обновите срок действия.`
    );
  }

  // Если код не существует, добавляем новый
  await collection.insertOne({ code, expiryDate, status: "pending" });
}

export async function validateCode(code) {
  const collection = db.collection("codes");
  return await collection.findOne({ code, status: "pending" });
}

export async function getAllCodes() {
  const collection = db.collection("codes");
  return await collection.find({}).toArray();
}

export async function deleteCode(code) {
  const collection = db.collection("codes");
  const result = await collection.deleteOne({ code });
  return result.deletedCount > 0;
}

export async function deleteAllCodes() {
  const collection = db.collection("codes");
  const result = await collection.deleteMany({});
  return result.deletedCount;
}
