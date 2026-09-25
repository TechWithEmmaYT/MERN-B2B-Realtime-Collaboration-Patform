import { ConflictException, UnauthorizedException } from "../utils/app-error";
import { compareValue } from "../utils/bcrypt";
import { signJwtToken } from "../utils/jwt";
import { createUser, getUserByEmail, toAuthUser } from "./user.service";

export const register = async (input: {
  name: string;
  email: string;
  password: string;
}) => {
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new ConflictException("An account with this email already exists");
  }

  const user = await createUser(input);

  return { user: toAuthUser(user), token: signJwtToken(user._id.toString()) };
};

export const login = async (input: { email: string; password: string }) => {
  const user = await getUserByEmail(input.email);

  if (!user?.password) {
    throw new UnauthorizedException("Invalid email or password");
  }

  const matches = await compareValue(input.password, user.password);
  if (!matches) {
    throw new UnauthorizedException("Invalid email or password");
  }

  return { user: toAuthUser(user), token: signJwtToken(user._id.toString()) };
};
