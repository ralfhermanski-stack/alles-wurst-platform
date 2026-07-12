/**
 * lib/db/prisma.ts — Prisma-Client-Singleton für Alles-Wurst 2.0
 */

import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Erhöhen, wenn das Schema kritische Felder/Modelle ändert —
 * invalidiert gecachte Hot-Reload-Instanzen zuverlässig.
 */
const PRISMA_SCHEMA_GENERATION = 9;

type TaggedPrismaClient = PrismaClient & {
  __awSchemaGeneration?: number;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaGeneration?: number;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  }) as TaggedPrismaClient;

  client.__awSchemaGeneration = PRISMA_SCHEMA_GENERATION;

  return client;
}

function userModelHasSystemRole(): boolean {
  const userModel = Prisma.dmmf.datamodel.models.find(
    (model) => model.name === "User",
  );

  return Boolean(
    userModel?.fields.some((field) => field.name === "systemRole"),
  );
}

function forumModelsAvailable(client: PrismaClient): boolean {
  return (
    typeof client.forumThread?.count === "function" &&
    typeof client.forumPost?.count === "function"
  );
}

function legalModelsAvailable(client: PrismaClient): boolean {
  return (
    typeof client.legalDocument?.upsert === "function" &&
    typeof client.withdrawalRequest?.create === "function"
  );
}

function accountPrivacyModelsAvailable(client: PrismaClient): boolean {
  return (
    typeof client.orderLegalDocument?.findMany === "function" &&
    typeof client.privacyRequest?.create === "function" &&
    typeof client.userAccountMessage?.create === "function"
  );
}

function isPrismaClientCurrent(client: PrismaClient): boolean {
  const tagged = client as TaggedPrismaClient;

  return (
    tagged.__awSchemaGeneration === PRISMA_SCHEMA_GENERATION &&
    typeof client.courseGroup?.findMany === "function" &&
    typeof client.courseSubgroup?.findMany === "function" &&
    typeof client.platformText?.findUnique === "function" &&
    typeof client.editablePage?.findMany === "function" &&
    userModelHasSystemRole() &&
    forumModelsAvailable(client) &&
    legalModelsAvailable(client) &&
    accountPrivacyModelsAvailable(client)
  );
}

function resolvePrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  if (
    cached &&
    (!isPrismaClientCurrent(cached) ||
      globalForPrisma.prismaSchemaGeneration !== PRISMA_SCHEMA_GENERATION)
  ) {
    void cached.$disconnect();
    return createPrismaClient();
  }

  return cached ?? createPrismaClient();
}

let activeClient = resolvePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = activeClient;
  globalForPrisma.prismaSchemaGeneration = PRISMA_SCHEMA_GENERATION;
}

/**
 * Erzwingt einen frischen Prisma-Client (z. B. wenn systemRole fehlt).
 */
export async function refreshPrismaClient(): Promise<PrismaClient> {
  await activeClient.$disconnect();
  activeClient = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = activeClient;
    globalForPrisma.prismaSchemaGeneration = PRISMA_SCHEMA_GENERATION;
  }

  return activeClient;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(activeClient, property, receiver);

    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(activeClient);
    }

    return value;
  },
});

export function isUserSystemRoleAvailable(): boolean {
  return userModelHasSystemRole();
}
