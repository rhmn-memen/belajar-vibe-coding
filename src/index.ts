import { Elysia } from "elysia";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = new Elysia()
  .get("/", () => ({
    message: "Welcome to Backend API (Bun + Elysia + Postgres + Drizzle)",
    status: "online"
  }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString()
  }))
  .listen(port);

console.log(`🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
