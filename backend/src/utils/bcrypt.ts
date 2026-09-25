import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashValue = (value: string, saltRounds = SALT_ROUNDS): Promise<string> =>
  bcrypt.hash(value, saltRounds);

export const compareValue = (value: string, hashedValue: string): Promise<boolean> =>
  bcrypt.compare(value, hashedValue);
