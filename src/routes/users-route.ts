import { Elysia, t } from "elysia";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
} from "../services/users-service";

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
  .get(
    "/current",
    async ({ headers, set }) => {
      const authorization = headers["authorization"];
      if (!authorization || !authorization.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const token = authorization.slice(7).trim();
      if (!token) {
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
    }
  );


