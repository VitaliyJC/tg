import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    tgId: {
      type: String,
      required: true,
      immutable: true,
    },
    firstName: {
      type: String,
    },
    usernameTg: {
      type: String,
    },
    isPremium: {
      type: Boolean,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
    },
    paidUntil: {
      type: Date,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Добавляем виртуальное поле isActive
UserSchema.virtual("isActive").get(function () {
  // Проверяем, что поле paidUntil установлено и сравниваем его с текущей датой
  return this.paidUntil && new Date() < this.paidUntil;
});

export default mongoose.model("User", UserSchema);
