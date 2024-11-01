import CodeModel from "../models/index.js";

export const addCode = async (code, expiryDate) => {
  try {
    await CodeModel.create({
      code,
      status: "pending",
      expiryDate,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getAllCodes = async () => {
  try {
    return await CodeModel.find().exec();
  } catch (error) {
    console.log(error);
  }
};

export const deleteCode = async (code) => {
  try {
    const result = await CodeModel.findOneAndDelete({ code });
    if (result) {
      console.log(`Код доступа ${code} успешно удален.`);
    } else {
      console.log(`Код доступа  ${code} не найден.`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const deleteAllCodes = async () => {
  try {
    const result = await CodeModel.deleteMany({});
    if (result.deletedCount > 0) {
      console.log(`Все коды доступа успешно удалены.`);
      return result.deletedCount;
    } else {
      console.log(`Невозможно удалить все коды доступа`);
    }
  } catch (error) {
    console.log(error);
  }
};
