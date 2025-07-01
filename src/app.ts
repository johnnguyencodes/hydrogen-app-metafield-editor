import { promises as fs } from "node:fs";
import path from "path";
import { fetchPlantFilesFromAdmin } from "./lib/fetchPlantFilesFromAdmin";

async function main() {
  try {
    const response = await fetchPlantFilesFromAdmin();
    const data = JSON.stringify(response, null, 2);

    const outPath = path.resolve(process.cwd(), "output/master-image.json");
    await fs.writeFile(outPath, data, "utf-8");
    console.log("master-image.json written successfully");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
