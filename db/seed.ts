import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { urls } from "./schema";

config({ path: ".env" });

const db = drizzle(process.env.DATABASE_URL!);

const seedData = [
  // user_3EFlRXJEEEI3vGHDLiauoP0dZEo — trysingh716@gmail.com
  { shortCode: "abc1234", originalUrl: "https://github.com/trending",               userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "def5678", originalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "ghi9012", originalUrl: "https://nextjs.org/docs",                   userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "jkl3456", originalUrl: "https://tailwindcss.com/docs",              userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "mno7890", originalUrl: "https://orm.drizzle.team/docs/overview",    userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "pqr1234", originalUrl: "https://vercel.com/dashboard",              userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "stu5678", originalUrl: "https://clerk.com/docs",                    userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "vwx9012", originalUrl: "https://neon.tech/docs",                    userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "yza3456", originalUrl: "https://ui.shadcn.com/docs",                userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },
  { shortCode: "bcd7890", originalUrl: "https://www.typescriptlang.org/docs",       userId: "user_3EFlRXJEEEI3vGHDLiauoP0dZEo" },

  // user_3ELlNiOjnhj5cqTb2gve6L26jl2 — wepot79141@matkind.com
  { shortCode: "efg1234", originalUrl: "https://react.dev/learn",                   userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "hij5678", originalUrl: "https://developer.mozilla.org/en-US/",      userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "klm9012", originalUrl: "https://stackoverflow.com/questions",       userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "nop3456", originalUrl: "https://www.reddit.com/r/programming",      userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "qrs7890", originalUrl: "https://news.ycombinator.com",              userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "tuv1234", originalUrl: "https://www.npmjs.com",                     userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "wxy5678", originalUrl: "https://bun.sh/docs",                       userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "zab9012", originalUrl: "https://vitejs.dev/guide",                  userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "cde3456", originalUrl: "https://eslint.org/docs/latest",            userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },
  { shortCode: "fgh7890", originalUrl: "https://prettier.io/docs/en",               userId: "user_3ELlNiOjnhj5cqTb2gve6L26jl2" },

  // user_3ELmSGUbZ6SFWN40MT2Wcc2GPud — magece1908@matkind.com
  { shortCode: "ijk1234", originalUrl: "https://www.google.com/maps",               userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "lmn5678", originalUrl: "https://docs.docker.com/get-started",       userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "opq9012", originalUrl: "https://kubernetes.io/docs/home",           userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "rst3456", originalUrl: "https://aws.amazon.com/documentation",      userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "uvw7890", originalUrl: "https://cloud.google.com/docs",             userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "xyz1234", originalUrl: "https://portal.azure.com",                  userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "abc5678", originalUrl: "https://stripe.com/docs",                   userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "def9012", originalUrl: "https://supabase.com/docs",                 userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "ghi3456", originalUrl: "https://planetscale.com/docs",              userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
  { shortCode: "jkl7890", originalUrl: "https://fly.io/docs",                       userId: "user_3ELmSGUbZ6SFWN40MT2Wcc2GPud" },
];

async function seed() {
  console.log("Seeding database...");
  await db.insert(urls).values(seedData).onConflictDoNothing();
  console.log(`Inserted up to ${seedData.length} URLs (10 per user) — skipped any duplicates.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
