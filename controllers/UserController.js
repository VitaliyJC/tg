import mongoose from "mongoose";
import bcrypt from "bcrypt";
import UserModel from "../models/User.js";
import CodeModel from "../models/Code.js";

export const isUsernameUnique = async (username) => {
  try {
    const result = await UserModel.findOne({ username });
    return !result;
  } catch (error) {
    console.error("Ошибка при проверке уникальности пользователя:", error);
    throw error;
  }
};

export const addUser = async (username, password, accessCode) => {
  try {
    await CodeModel.validateCode(accessCode, true);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const accessCodeObjectId = mongoose.Types.ObjectId(accessCode);

    await UserModel.create({
      username,
      passwordHash: hash,
      status: "active",
      paidUntil: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // доступ на 24 часа
      code: accessCodeObjectId,
    });

    await CodeModel.findOneAndUpdate(
      { code: accessCode },
      { status: "activated" }
    );
  } catch (error) {
    console.log(error);
  }
};

export const getAllUsers = async () => {
  try {
    return await UserModel.find().exec();
  } catch (error) {
    console.log(error);
  }
};

export const deleteUser = async (username) => {
  try {
    const result = await UserModel.findOneAndDelete({ username });
    if (result) {
      console.log(`Пользователь ${username} успешно удален.`);
    } else {
      console.log(`Пользователь ${username} не найден.`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const updateUserAccess = async (username, date) => {
  try {
    const result = await UserModel.updateOne(
      {
        username,
      },
      {
        paidUntil: date,
        status: "active",
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `Доступ для пользователя ${username} успешно обновлен до ${date} и статус установлен "active"`
      );
    } else {
      console.log(`Пользователь ${username} не найден.`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const updateUserPassword = async (username, password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await UserModel.updateOne(
      {
        username,
      },
      {
        passwordHash: hash,
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Пароль для пользователя ${username} успешно обновлен.`);
    } else {
      console.log(`Пользователь ${username} не найден.`);
    }
  } catch (error) {
    console.log(error);
  }
};
