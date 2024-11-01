import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Code",
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
