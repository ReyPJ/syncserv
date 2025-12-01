import { PrismaClient } from "@prisma/client";

const prismaBase = new PrismaClient();

export function createTenantPrismaClient(tenantId: string) {
  return prismaBase.$extends({
    query: {
      cliente: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async create({ args, query }) {
          const data = args.data as Record<string, unknown>;
          data.tenantId = tenantId;
          return query(args);
        },
        async update({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async delete({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
      },
      case: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async create({ args, query }) {
          const data = args.data as Record<string, unknown>;
          data.tenantId = tenantId;
          return query(args);
        },
        async update({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async delete({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
      },
      invoice: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async create({ args, query }) {
          const data = args.data as Record<string, unknown>;
          data.tenantId = tenantId;
          return query(args);
        },
        async update({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async delete({ args, query }) {
          if (args.where) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
      },
    },
  });
}

export { prismaBase as prisma };
