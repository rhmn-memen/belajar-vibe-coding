import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "./users-route";

describe("POST /api/users", () => {
  it("should return data: OK on successful registration", async () => {
    const mockRegister = mock(async () => ({ success: true }));
    mock.module("../services/users-service", () => ({
      registerUserService: mockRegister,
      loginUserService: mock(async () => ({ token: "mock-token" })),
      getCurrentUserService: mock(async () => ({
        id: 1,
        name: "rahman",
        email: "rahman@localhost",
        created_at: "timestamp",
      })),
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
      getCurrentUserService: mock(async () => ({
        id: 1,
        name: "rahman",
        email: "rahman@localhost",
        created_at: "timestamp",
      })),
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
      getCurrentUserService: mock(async () => ({
        id: 1,
        name: "rahman",
        email: "rahman@localhost",
        created_at: "timestamp",
      })),
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
      getCurrentUserService: mock(async () => ({
        id: 1,
        name: "rahman",
        email: "rahman@localhost",
        created_at: "timestamp",
      })),
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

describe("GET /api/users/current", () => {
  it("should return user data on valid token", async () => {
    const mockUser = {
      id: 1,
      name: "rahman",
      email: "rahman@localhost",
      created_at: "2026-09-27T00:00:00.000Z",
    };
    const mockGetCurrentUser = mock(async () => mockUser);
    mock.module("../services/users-service", () => ({
      registerUserService: mock(async () => ({ success: true })),
      loginUserService: mock(async () => ({ token: "mock-token" })),
      getCurrentUserService: mockGetCurrentUser,
    }));

    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ data: mockUser });
  });

  it("should return 401 Unauthorized if Authorization header is missing or malformed", async () => {
    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("should return 401 Unauthorized if token is invalid or session not found", async () => {
    const mockGetCurrentUser = mock(async () => {
      throw new Error("Unauthorized");
    });
    mock.module("../services/users-service", () => ({
      registerUserService: mock(async () => ({ success: true })),
      loginUserService: mock(async () => ({ token: "mock-token" })),
      getCurrentUserService: mockGetCurrentUser,
    }));

    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });
});


describe("DELETE /api/users/logout", () => {
  it("should return data: OK on successful logout", async () => {
    const mockLogout = mock(async () => ({ success: true }));
    mock.module("../services/users-service", () => ({
      registerUserService: mock(async () => ({ success: true })),
      loginUserService: mock(async () => ({ token: "mock-token" })),
      getCurrentUserService: mock(async () => ({
        id: 1,
        name: "rahman",
        email: "rahman@localhost",
        created_at: "timestamp",
      })),
      logoutUserService: mockLogout,
    }));

    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token",
        },
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ data: "OK" });
  });

  it("should return 401 Unauthorized if Authorization header is missing or malformed", async () => {
    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("should return 401 Unauthorized if session is not found or invalid token", async () => {
    const mockLogout = mock(async () => {
      throw new Error("Unauthorized");
    });
    mock.module("../services/users-service", () => ({
      registerUserService: mock(async () => ({ success: true })),
      loginUserService: mock(async () => ({ token: "mock-token" })),
      getCurrentUserService: mock(async () => ({
        id: 1,
        name: "rahman",
        email: "rahman@localhost",
        created_at: "timestamp",
      })),
      logoutUserService: mockLogout,
    }));

    const app = new Elysia().use(usersRoute);
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });
});



