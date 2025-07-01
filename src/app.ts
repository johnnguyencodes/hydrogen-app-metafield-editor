import { pullFilesFromAdmin } from "./lib/script";

async function main() {
  const output = await pullFilesFromAdmin();
  console.log(output);
}

main().catch((err) => {
  console.error("Fatal error", err);
  process.exit(1);
});
