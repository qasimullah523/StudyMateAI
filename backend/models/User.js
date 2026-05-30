const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    preferences: {
      theme: { type: String, default: "light" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
