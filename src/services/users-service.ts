import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
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

export async function loginUserService(input: LoginUserInput) {
  // 1. Find user by email
  const existingUsers = await db
    .select({
      id: users.id,
      password: users.password,
    })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUsers.length === 0) {
    throw new Error("Email atau password salah");
  }

  const user = existingUsers[0];

  // 2. Verify password
  const isPasswordValid = await Bun.password.verify(
    input.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new Error("Email atau password salah");
  }

  // 3. Generate UUID token
  const token = crypto.randomUUID();

  // 4. Create session record
  await db.insert(sessions).values({
    token: token,
    userId: user.id,
  });

  return { token };
}

export async function getCurrentUserService(token: string) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      created_at: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Unauthorized");
  }

  return result[0];
}

export async function logoutUserService(token: string) {
  const deleted = await db
    .delete(sessions)
    .where(eq(sessions.token, token))
    .returning({ id: sessions.id });

  if (deleted.length === 0) {
    throw new Error("Unauthorized");
  }

  return { success: true };
}
