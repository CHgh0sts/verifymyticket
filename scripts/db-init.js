const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Initialise la base SQLite par défaut :
 * - crée .env depuis .env.example si absent
 * - prisma generate + db push (crée prisma/dev.db)
 * - seed admin vérifié
 */
function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: path.join(__dirname, "..") });
}

function ensureEnv() {
  const root = path.join(__dirname, "..");
  const envPath = path.join(root, ".env");
  const examplePath = path.join(root, ".env.example");

  if (!fs.existsSync(envPath)) {
    if (!fs.existsSync(examplePath)) {
      throw new Error(".env.example introuvable");
    }
    fs.copyFileSync(examplePath, envPath);
    console.log("Fichier .env créé depuis .env.example");
  } else {
    console.log("Fichier .env déjà présent");
  }

  // Force SQLite local si DATABASE_URL manquant / PostgreSQL
  let env = fs.readFileSync(envPath, "utf8");
  if (!/^DATABASE_URL=.+/m.test(env)) {
    env += `\nDATABASE_URL="file:./dev.db"\n`;
    fs.writeFileSync(envPath, env);
    console.log("DATABASE_URL ajouté → file:./dev.db");
  } else if (!/DATABASE_URL=["']?file:/m.test(env)) {
    env = env.replace(/^DATABASE_URL=.*$/m, 'DATABASE_URL="file:./dev.db"');
    fs.writeFileSync(envPath, env);
    console.log("DATABASE_URL forcé sur SQLite → file:./dev.db");
  }
}

function main() {
  console.log("=== VerifyMyTicket — db:init ===");
  ensureEnv();
  run("npx prisma generate");
  run("npx prisma db push --accept-data-loss");
  run("node prisma/seed.js");
  console.log("\nBase prête : prisma/dev.db");
  console.log("Admin : admin@verifymyticket.local / Admin123!");
}

main();
