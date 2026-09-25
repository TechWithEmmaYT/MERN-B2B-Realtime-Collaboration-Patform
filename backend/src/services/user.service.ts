import { User, type UserDocument } from "../models/user.model";
import type { AuthUser } from "../types/auth";

export const toAuthUser = (user: UserDocument): AuthUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl ?? null,
  createdAt: user.createdAt,
});

export const getUserByEmail = (email: string) =>
  User.findOne({ email }).select("+password");

export const getUserById = (id: string) => User.findById(id);

export const createUser = (input: {
  name: string;
  email: string;
  password: string;
}) => User.create(input);
