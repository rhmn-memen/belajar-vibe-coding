import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "./users-route";

describe("POST /api/users", () => {
  it("should return data: OK on successful registration", async () => {
    const mockRegister = mock(async () => ({ success: true }));
    mock.module("../services/users-service", () => ({
      registerUserService: mockRegister,
      loginUserService: mock(async () => ({ token: "mock-token" })),
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
      loginUserService: mock(async () => ({ token: "mock-token" })),
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

describe("POST /api/users/login", () => {
  it("should return token on successful login", async () => {
    const mockLogin = mock(async () => ({ token: "sample-uuid-token" }));
    mock.module("../services/users-service", () => ({
      registerUserService: mock(async () => ({ success: true })),
      loginUserService: mockLogin,
    }));

    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "rahman@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ data: "sample-uuid-token" });
  });

  it("should return error on invalid credentials", async () => {
    const mockLogin = mock(async () => {
      throw new Error("Email atau password salah");
    });
    mock.module("../services/users-service", () => ({
      registerUserService: mock(async () => ({ success: true })),
      loginUserService: mockLogin,
    }));

    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "rahman@localhost",
          password: "wrongpassword",
        }),
      })
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({ error: "Email atau password salah" });
  });
});

