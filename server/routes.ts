import type { Server } from 'node:http';
import type { Express } from 'express';

export async function registerRoutes(httpServer: Server, _app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
