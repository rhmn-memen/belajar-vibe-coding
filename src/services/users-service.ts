import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export async function registerUserService(input: RegisterUserInput) {
  // 1. Check if email is already registered
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  // 2. Hash password using Bun's native bcrypt hashing
  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Insert new user into database
  await db.insert(users).values({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  return { success: true };
}
