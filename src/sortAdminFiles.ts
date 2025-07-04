import type { MediaFileWithMetadata, ProductData } from "types/global";
import { promises as fs } from "node:fs";
import path from "path";

// Each media file pulled from Shopify's admin API is a file object. Each object has an image.url that must be named with the following structure
// `${productType}--${product.handle}--YYYY-MM-DD--${imageType}--${index}.${fileExtension}`
// For example: plants--mammillaria-crucigera-tlalocii-3--2025-05-25--carousel--001.webp
// for .mp4 movie files, also include the name of the file in the alt.
// When a movie file is uploaded to Shopify, the file is renamed in Shopify's server
// Using alt is the only way to retain a record of the original file name

async function loadMedia(): Promise<any[]> {
  const masterMediaPath = path.resolve(
    process.cwd(),
    "output/master-media.json"
  );

  const raw = await fs.readFile(masterMediaPath, "utf-8");
  return JSON.parse(raw);
}

// getting url of media that contains filename
function extractUrl(media: any): string | undefined {
  // generic files
  if (typeof media.url === "string") return media.url;
  // image
  if (media.image?.url) return media.image.url;
  // video
  if (media.originalSource?.url) return media.alt;
  // 3d model
  if (Array.isArray(media.sources) && media.sources[0]?.url) {
    return media.sources[0].url;
  }

  //fallback
  return undefined;
}

// extracting media filename from url
function filenameFromUrl(fullUrl: string): string {
  const cleanedUrl = fullUrl.split("?")[0];
  const filenameWithExt = cleanedUrl.split("/").pop()!;

  return filenameWithExt;
}

// parsing meta data from url
function parseMeta(filename: string) {
  const [productType, handle, date, category, indexWithExt] =
    filename.split("--");
  const index = indexWithExt.split(".")[0];
  const ext = indexWithExt.split(".").pop()!;
  return { productType, handle, date, category, index, ext };
}

// By the time sortMedia is invoked, all metafields have been sorted by their handle
// Now, they will be sorted by media category, date, and index
function sortMedia(a: MediaFileWithMetadata, b: MediaFileWithMetadata): number {
  const { category: aCategory, date: aDate, index: aIndex } = a.meta;
  const { category: bCategory, date: bDate, index: bIndex } = b.meta;

  // 1. Sort by category alphabetically
  if (aCategory !== bCategory) {
    return aCategory.localeCompare(bCategory);
  }
  // 2. Sort by date (most recent first)
  const aDateObj = new Date(aDate);
  const bDateObj = new Date(bDate);

  if (bDateObj.getTime() !== aDateObj.getTime()) {
    return bDateObj.getTime() - aDateObj.getTime();
  }

  // 3. Sort by index from lowest to highest
  return aIndex - bIndex;
}

// Run the script
async function run() {
  const allMedia = await loadMedia();
  // Create data structure to hold all unique handles
  const byHandle = new Map<string, { productType: string; nodes: any[] }>();

  // iterate through each node and push it to map by the handle
  for (const node of allMedia) {
    const url = extractUrl(node);
    if (!url) continue;
    const fileName = filenameFromUrl(url);
    const { productType, handle, date, category, index, ext } =
      parseMeta(fileName);

    // adding metadata to metafield for easier processing in hydrogen app
    const meta = {
      category: category,
      date: date,
      index: index,
      ext: ext,
    };

    node.meta = meta;

    // setting and pushing media data to map by handle
    if (!byHandle.has(handle)) {
      byHandle.set(handle, { productType, nodes: [] });
    }
    byHandle.get(handle)!.nodes.push(node);
  }

  // sorting metafields by category, date, index
  for (const [_handle, { productType: _productType, nodes }] of byHandle) {
    nodes.sort(sortMedia);
  }

  // due to the recursive flag, this ensures the target directory
  // already exists, by either making the directory or silently exiting
  await fs.mkdir(path.resolve(process.cwd(), "output"), { recursive: true });

  // write the media metafields to their own json file
  for (const [handle, { productType, nodes }] of byHandle) {
    const targetFile = path.resolve(
      process.cwd(),
      `product-data/${productType}`,
      `${handle}.json`
    );

    // read the file
    const fileText = await fs.readFile(targetFile, "utf-8");

    // parse it into a JS object
    const doc = JSON.parse(fileText) as ProductData;

    // find the mediaMetafield
    const mediaMetafield = doc.metafields.find(
      (metafield) => metafield.key === "images"
    );

    if (mediaMetafield) {
      mediaMetafield.value = nodes;
    } else {
      doc.metafields.push({
        namespace: "plant",
        key: "images",
        type: "json",
        value: nodes,
      });
    }

    await fs.writeFile(targetFile, JSON.stringify(doc, null, 2), "utf-8");
    console.log(`Injected ${nodes.length} items into ${targetFile}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
