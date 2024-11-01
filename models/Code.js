import mongoose from "mongoose";

const CodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["activated", "pending", "expired"],
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

CodeSchema.statics.validateCode = async function (
  codeString,
  throwError = false
) {
  // Находим код по значению
  const code = await this.findOne({ code: codeString });

  // Проверяем, существует ли код
  if (!code) {
    if (throwError) throw new Error("Код не найден.");
    return null; // Возвращаем null, если код не найден
  }

  // Проверяем, не истек ли срок действия кода и обновляем статус, если срок истек
  if (new Date() > code.expiryDate) {
    await this.updateOne({ code: codeString }, { $set: { status: "expired" } });
    if (throwError) throw new Error("Срок действия кода истек.");
    return null; // Возвращаем null, если срок истек
  }

  // Проверяем, активен ли код
  if (code.status !== "pending") {
    if (throwError) throw new Error("Код уже активирован или истек.");
    return null; // Возвращаем null, если код неактивен
  }

  // Если все проверки пройдены, возвращаем объект кода
  return code;
};

export default mongoose.model("Code", CodeSchema);
