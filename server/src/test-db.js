import { prisma } from "./lib/prisma.js";

const count = await prisma.user.count();
console.log("Connected! Users in database:", count);
await prisma.$disconnect();