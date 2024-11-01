import CodeModel from "../models/Code.js";

export const addCode = async (code, expiryDate) => {
  try {
    await CodeModel.create({ code, status: "pending", expiryDate });
    console.log(`Код ${code} успешно добавлен с датой истечения ${expiryDate}`);
  } catch (error) {
    console.log("Ошибка при добавлении кода:", error);
  }
};

export const getAllCodes = async () => {
  try {
    const codes = await CodeModel.find().exec();
    console.log(`Получено ${codes.length} кодов`);
    return codes;
  } catch (error) {
    console.log("Ошибка при получении всех кодов:", error);
  }
};

export const deleteCode = async (code) => {
  try {
    const result = await CodeModel.findOneAndDelete({ code });
    console.log(
      result
        ? `Код доступа ${code} успешно удален.`
        : `Код доступа ${code} не найден.`
    );
  } catch (error) {
    console.log("Ошибка при удалении кода:", error);
  }
};

export const deleteAllCodes = async () => {
  try {
    const result = await CodeModel.deleteMany({});
    console.log(
      result.deletedCount > 0
        ? "Все коды доступа успешно удалены."
        : "Нет кодов для удаления."
    );
    return result.deletedCount;
  } catch (error) {
    console.log("Ошибка при удалении всех кодов:", error);
  }
};

export const validateCode = async (codeString, throwError = false) => {
  try {
    const code = await CodeModel.findOne({ code: codeString });
    console.log("Найденный код:", code);

    if (!code) {
      if (throwError) throw new Error("Код не найден.");
      return false;
    }

    const now = new Date();

    // Проверяем срок действия
    if (now > code.expiryDate) {
      if (code.status === "pending") {
        await CodeModel.updateOne(
          { code: codeString },
          { $set: { status: "expired" } }
        );
        console.log("Срок действия истек, статус кода обновлен на 'expired'");
      }
      if (throwError) throw new Error("Срок действия кода истек.");
      return false;
    }

    // Проверка статуса
    if (code.status === "activated") {
      if (throwError) throw new Error("Код уже активирован.");
      console.log("Код уже активирован.");
      return false;
    }

    if (code.status === "expired") {
      if (throwError) throw new Error("Срок действия кода истек.");
      console.log("Срок действия кода истек.");
      return false;
    }

    console.log("Код прошел все проверки.");
    return true;
  } catch (error) {
    console.log("Ошибка при проверке кода:", error);
    return false;
  }
};
