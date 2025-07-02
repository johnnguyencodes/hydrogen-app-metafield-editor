import { watch } from "node:fs";
import path from "path";

function watchForChangesInDirectory(destination: string) {
  try {
    const directoryToWatch = path.resolve(process.cwd(), "product-data");

    watch(directoryToWatch, { recursive: true }, (eventType, filename) => {
      console.log("eventType and filename", eventType, filename);
    });
    console.log(`watching for file changes in ${destination}`);
  } catch (err) {
    console.error(err);
  }
}

watchForChangesInDirectory("product-data");
