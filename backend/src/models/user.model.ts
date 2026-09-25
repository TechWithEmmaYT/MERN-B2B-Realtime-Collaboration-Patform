import { model, Schema, type HydratedDocument, type Model } from "mongoose";

import { hashValue } from "../utils/bcrypt";

export interface IUser {
  name: string;
  email: string;
  password?: string;
  googleId?: string | null;
  avatarUrl?: string | null;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, default: null },
    emailVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || !this.password) return;
  this.password = await hashValue(this.password);
});

userSchema.set("toJSON", {
  transform: (_document, returned) => {
    delete returned.password;
    return returned;
  },
});

export const User: Model<IUser> = model<IUser>("User", userSchema);
