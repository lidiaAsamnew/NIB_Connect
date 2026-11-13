require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { createApp } = require("./src/app");

const prisma = new PrismaClient();
const app = createApp({ prisma });
const port = Number(process.env.PORT || 3000);

const server = app.listen(port, () => {
  console.log(`NIB-Connect API running on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
