import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import * as userService from "../services/users-service";
import { usersRoute } from "./users-route";

describe("POST /api/users", () => {
  it("should return data: OK on successful registration", async () => {
    const mockRegister = mock(async () => ({ success: true }));
    const spy = mock.module("../services/users-service", () => ({
      registerUserService: mockRegister,
    }));

    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "rahman",
          email: "rahman@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ data: "OK" });
  });

  it("should return error when email is already registered", async () => {
    const mockRegister = mock(async () => {
      throw new Error("Email sudah terdaftar");
    });
    mock.module("../services/users-service", () => ({
      registerUserService: mockRegister,
    }));

    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "rahman",
          email: "rahman@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({ error: "Email sudah terdaftar" });
  });
});
