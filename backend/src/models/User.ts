import { Schema, model, type HydratedDocument } from "mongoose";

export type ThemePreference = "light" | "dark";

export interface UserPreferences {
  theme?: ThemePreference;
}

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  preferences?: UserPreferences;
}

const UserSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, required: true },
    preferences: {
      theme: { type: String, default: "light" },
    },
  },
  { timestamps: true },
);

export type UserDocument = HydratedDocument<User>;

const UserModel = model<User>("User", UserSchema);

export default UserModel;
