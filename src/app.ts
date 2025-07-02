import { promises as fs } from "node:fs";
import path from "path";
import { fetchAdminFiles } from "./lib/fetchAdminFiles";
import { fetchProductsAndMetafields } from "./lib/fetchProductsAndMetafields";

async function main() {
  try {
    const response = await fetchAdminFiles();
    const data = JSON.stringify(response, null, 2);

    const outPath = path.resolve(process.cwd(), "output/master-image.json");
    await fs.writeFile(outPath, data, "utf-8");
    console.log("master-image.json written successfully");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  try {
    const response = await fetchProductsAndMetafields();
    const text = JSON.stringify(
      response,
      (_key, value) => {
        if (value && value.type === "json") {
          return {
            ...value,
            value: JSON.parse(value.value),
          };
        }
        return value;
      },
      2
    );

    const outPath = path.resolve(process.cwd(), "output/master-product.json");
    await fs.writeFile(outPath, text, "utf-8");
    console.log("master-product.json written successfully");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  try {
    const masterImagePath = path.resolve(
      process.cwd(),
      "output/master-product.json"
    );
    const jsonData = await fs.readFile(masterImagePath, "utf-8");
    const parsedData = JSON.parse(jsonData);

    for (const product of parsedData) {
      const handle = product.handle;
      const data = product;
      const productType = product.productType;
      const outPath = path.resolve(
        process.cwd(),
        `product-data/${productType}/${handle}.json`
      );
      await fs.writeFile(outPath, JSON.stringify(data, null, 2), "utf-8");
    }
    console.log("product json files written successfully");
  } catch (err) {
    console.error(err);
  }
}

main();
