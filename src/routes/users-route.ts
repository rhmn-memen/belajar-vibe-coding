import { Elysia, t } from "elysia";
import { registerUserService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" }).post(
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
);
