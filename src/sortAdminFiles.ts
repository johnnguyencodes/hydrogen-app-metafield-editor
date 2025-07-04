import type { MediaFileWithMetadata } from "types/global";
import { promises as fs } from "node:fs";
import path from "path";

async function loadMedia(): Promise<any[]> {
  const masterMediaPath = path.resolve(
    process.cwd(),
    "output/master-media.json"
  );

  const raw = await fs.readFile(masterMediaPath, "utf-8");
  return JSON.parse(raw);
}

function extractUrl(media: any): string | undefined {
  // generic files
  if (typeof media.url === "string") return media.url;
  // image
  if (media.image?.url) return media.image.url;
  // video
  if (media.originalSource?.url) return media.alt;
  // model
  if (Array.isArray(media.sources) && media.sources[0]?.url) {
    return media.sources[0].url;
  }

  //fallback
  return undefined;
}

function filenameFromUrl(fullUrl: string): string {
  // extracting only the name of the file with no extension
  const cleanedUrl = fullUrl.split("?")[0];
  const filenameWithExt = cleanedUrl.split("/").pop()!;

  return filenameWithExt;
}

function parseMeta(filename: string) {
  const [productType, handle, date, category, indexWithExt] =
    filename.split("--");
  const index = indexWithExt.split(".")[0];
  const ext = indexWithExt.split(".").pop()!;
  return { productType, handle, date, category, index, ext };
}

function sortMedia(a: MediaFileWithMetadata, b: MediaFileWithMetadata): number {
  const { date: aDate, category: aCategory, index: aIndex } = a.meta;
  const { date: bDate, category: bCategory, index: bIndex } = b.meta;

  // 1. Sort by date (most recent first)
  const aDateObj = new Date(aDate);
  const bDateObj = new Date(bDate);

  if (bDateObj.getTime() !== aDateObj.getTime()) {
    return bDateObj.getTime() - aDateObj.getTime();
  }

  // 2. Sort by imageType alphabetically
  if (aCategory !== bCategory) {
    return aCategory.localeCompare(bCategory);
  }

  // 3. Sort by index from lowest to highest
  return aIndex - bIndex;
}

async function run() {
  const allMedia = await loadMedia();
  // Create data structure to hold all unique handles
  const byHandle = new Map<string, any[]>();

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

    if (!byHandle.has(handle)) {
      byHandle.set(handle, []);
    }
    byHandle.get(handle)!.push(node);
  }

  // sorting metafields by category, date, index
  for (const [_, nodes] of byHandle) {
    nodes.sort(sortMedia);
  }

  await fs.mkdir(path.resolve(process.cwd(), "output"), { recursive: true });
  for (const [handle, mediaNodes] of byHandle) {
    const outPath = path.resolve(process.cwd(), "output", `${handle}.json`);
    await fs.writeFile(outPath, JSON.stringify(mediaNodes, null, 2), "utf-8");
    console.log(`Wrote ${mediaNodes.length} items -> ${handle}.json`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

// fetching all products and metafields and writing them to a json file for later processing
// try {
//   const response = await fetchProductsAndMetafields();
//   const text = JSON.stringify(
//     response,
//     (_key, value) => {
//       if (value && value.type === "json") {
//         return {
//           ...value,
//           value: JSON.parse(value.value),
//         };
//       }
//       return value;
//     },
//     2
//   );

//   const outPath = path.resolve(process.cwd(), "output/master-product.json");
//   await fs.writeFile(outPath, text, "utf-8");
//   console.log("master-product.json written successfully");
// } catch (err) {
//   console.error(err);
//   process.exit(1);
// }

/**
 * Manipulating data from critical loader to be usable on the page
 */

// const unsortedPlantImages = filterPlantImagesByHandle(
//   adminImageData,
//   product.handle,
// );

// const sortedPlantImages = unsortedPlantImages
//   .map(addImageMetadata)
//   .sort(sortImagesWithMetadata);

// console.log('sortedPlantImages:', sortedPlantImages);

// filterPlantImagesByHandle,
// addImageMetadata,
// sortImagesWithMetadata,

// Each plant image is a Shopify file object. Each object has a .image.url that must be named with the following structure
// `plants--${product.handle}--YYYY-MM-DD--${imageType}--${index}.${fileExtension}`
// For example: plants--mammillaria-crucigera-tlalocii-3--2025-05-25--carousel--001.webp
// function filterPlantImagesByHandle(
//   adminImageData: AdminImage[],
//   productHandle: string
// ) {
//   return adminImageData.filter((img) =>
//     img.image?.url?.includes(`plants--${productHandle}`)
//   );
// }

// Since unSortedPlantImages is only concerned about the first two parts of the shopify file object's url,
// the sorting logic will only be concerned about the latter 3 parts of the url:
//   - date
//   - image type
//   - index
// where imageType can be either
//   - carousel
//   - journal
//   - milestone
// fileExtension can be any file type, but in my comments I am assuming all images will be in .webp format.
// function addImageMetadata(img: AdminImage): AdminImageWithMetadata {
//   const regex = /--(\d{4}-\d{2}-\d{2})--([a-z]+)--(\d{3})\./;
//   const match = img.image.url.match(regex);

//   if (!match) {
//     return {
//       ...img,
//       meta: {
//         date: new Date(0),
//         imageType: "",
//         index: 0,
//       },
//     };
//   }

//   const [, dateStr, imageType, indexStr] = match;

//   return {
//     ...img,
//     meta: {
//       date: new Date(dateStr),
//       imageType,
//       index: parseInt(indexStr, 10),
//     },
//   };
// }
