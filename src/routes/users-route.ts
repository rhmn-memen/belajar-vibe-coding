import { Elysia, t } from "elysia";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  logoutUserService,
} from "../services/users-service";

// UUID v4 regex for early validation before hitting the database
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// DRY helper: extract and validate Bearer token from Authorization header
function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization || !authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        await registerUserService(body);
        set.status = 200;
        return { data: "OK" };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message || "Gagal mendaftarkan user" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const result = await loginUserService(body);
        set.status = 200;
        return { data: result.token };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message || "Email atau password salah" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/current", async ({ headers, set }) => {
    const token = extractBearerToken(headers["authorization"]);
    if (!token || !UUID_REGEX.test(token)) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const user = await getCurrentUserService(token);
      set.status = 200;
      return { data: user };
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .delete("/logout", async ({ headers, set }) => {
    const token = extractBearerToken(headers["authorization"]);
    if (!token || !UUID_REGEX.test(token)) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      await logoutUserService(token);
      set.status = 204;
      return;
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });
