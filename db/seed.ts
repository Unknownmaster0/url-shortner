import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { urls } from "./schema";

config({ path: ".env" });

const db = drizzle(process.env.DATABASE_URL!);

const userId1 = process.env.SEED_USER_ID_1!;
const userId2 = process.env.SEED_USER_ID_2!;
const userId3 = process.env.SEED_USER_ID_3!;

const seedData = [
  // User 1
  { shortCode: "abc1234", originalUrl: "https://github.com/trending",               userId: userId1 },
  { shortCode: "def5678", originalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", userId: userId1 },
  { shortCode: "ghi9012", originalUrl: "https://nextjs.org/docs",                   userId: userId1 },
  { shortCode: "jkl3456", originalUrl: "https://tailwindcss.com/docs",              userId: userId1 },
  { shortCode: "mno7890", originalUrl: "https://orm.drizzle.team/docs/overview",    userId: userId1 },
  { shortCode: "pqr1234", originalUrl: "https://vercel.com/dashboard",              userId: userId1 },
  { shortCode: "stu5678", originalUrl: "https://clerk.com/docs",                    userId: userId1 },
  { shortCode: "vwx9012", originalUrl: "https://neon.tech/docs",                    userId: userId1 },
  { shortCode: "yza3456", originalUrl: "https://ui.shadcn.com/docs",                userId: userId1 },
  { shortCode: "bcd7890", originalUrl: "https://www.typescriptlang.org/docs",       userId: userId1 },

  // User 2
  { shortCode: "efg1234", originalUrl: "https://react.dev/learn",                   userId: userId2 },
  { shortCode: "hij5678", originalUrl: "https://developer.mozilla.org/en-US/",      userId: userId2 },
  { shortCode: "klm9012", originalUrl: "https://stackoverflow.com/questions",       userId: userId2 },
  { shortCode: "nop3456", originalUrl: "https://www.reddit.com/r/programming",      userId: userId2 },
  { shortCode: "qrs7890", originalUrl: "https://news.ycombinator.com",              userId: userId2 },
  { shortCode: "tuv1234", originalUrl: "https://www.npmjs.com",                     userId: userId2 },
  { shortCode: "wxy5678", originalUrl: "https://bun.sh/docs",                       userId: userId2 },
  { shortCode: "zab9012", originalUrl: "https://vitejs.dev/guide",                  userId: userId2 },
  { shortCode: "cde3456", originalUrl: "https://eslint.org/docs/latest",            userId: userId2 },
  { shortCode: "fgh7890", originalUrl: "https://prettier.io/docs/en",               userId: userId2 },

  // User 3
  { shortCode: "ijk1234", originalUrl: "https://www.google.com/maps",               userId: userId3 },
  { shortCode: "lmn5678", originalUrl: "https://docs.docker.com/get-started",       userId: userId3 },
  { shortCode: "opq9012", originalUrl: "https://kubernetes.io/docs/home",           userId: userId3 },
  { shortCode: "rst3456", originalUrl: "https://aws.amazon.com/documentation",      userId: userId3 },
  { shortCode: "uvw7890", originalUrl: "https://cloud.google.com/docs",             userId: userId3 },
  { shortCode: "xyz1234", originalUrl: "https://portal.azure.com",                  userId: userId3 },
  { shortCode: "abc5678", originalUrl: "https://stripe.com/docs",                   userId: userId3 },
  { shortCode: "def9012", originalUrl: "https://supabase.com/docs",                 userId: userId3 },
  { shortCode: "ghi3456", originalUrl: "https://planetscale.com/docs",              userId: userId3 },
  { shortCode: "jkl7890", originalUrl: "https://fly.io/docs",                       userId: userId3 },
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
