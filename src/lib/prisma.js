import { PrismaClient } from "@prisma/client";

let prisma;

const createPrismaClient = (url) =>
  new PrismaClient({
    datasources: { db: { url } },
  });

async function initPrisma() {
  const poolUrl = process.env.DATABASE_URL;
  const directUrl =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (poolUrl) {
    try {
      console.log("🔌 Connecting to database (primary URL)...");
      prisma = createPrismaClient(poolUrl);
      await prisma.$connect();
      console.log("✅ Connected using primary URL");
      return;
    } catch (e) {
      console.error(
        "⚠️ Primary URL connection failed. Falling back to direct URL...",
        e?.message || e
      );
    }
  }

  if (!directUrl) {
    throw new Error(
      "DATABASE_URL not found. Set DATABASE_URL or DATABASE_URL_UNPOOLED/DATABASE_URL_DIRECT/DIRECT_URL"
    );
  }

  console.log("🔌 Connecting to database (direct URL)...");
  prisma = createPrismaClient(directUrl);
  await prisma.$connect();
  console.log("✅ Connected using direct URL");
}

if (!global.prisma) {
  global.prisma = (async () => {
    await initPrisma();
    return prisma;
  })();
}

export default global.prisma;
