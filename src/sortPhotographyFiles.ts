import type {
  PhotographyMediaFileWithMetadata,
  CategoryKey,
  CategoryMap,
  NodeGroup,
} from "types/global";
import { promises as fs } from "node:fs";
import path from "path";

// Each media file pulled from Shopify's admin API is a file object. Each object has an image.url that must be named with the following structure for photography images
// `photography--YYYY-MM-DD--${index}--${filmFormat}--${cameraBody}--${lens}--${filmStockBrand}--${isoNumber}--${aperture}--${shutterSpeed}.jpg`
// For example: /photography--2025-11-13--013--full-frame--nikon-d850--35mm-105mm-zoom-ais--45mp--iso-200--f56--1-3s.jpg

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
  const [
    fileType,
    date,
    index,
    filmFormat,
    cameraBody,
    lens,
    filmStockBrand,
    isoNumber,
    aperture,
    shutterspeed,
  ] = filename.split("--");
  const sanitizedShutterspeed = shutterspeed.split(".").slice(0, -1).toString();
  return {
    fileType,
    date,
    index,
    filmFormat, //
    cameraBody, //
    lens, //
    filmStockBrand, //
    isoNumber, //
    aperture,
    sanitizedShutterspeed,
  };
}

// By the time sortMedia is invoked, all photography images have been sorted into their categories
// Now, they will be sorted by date and index
function sortMedia(
  a: PhotographyMediaFileWithMetadata,
  b: PhotographyMediaFileWithMetadata
): number {
  const { date: aDate, index: aIndex } = a.meta;
  const { date: bDate, index: bIndex } = b.meta;

  // sort by date (most recent first)
  const aDateObj = new Date(aDate);
  const bDateObj = new Date(bDate);

  if (bDateObj.getTime() !== aDateObj.getTime()) {
    return bDateObj.getTime() - aDateObj.getTime();
  }

  // Then, sort by index from highest to lowest (highest index is most recent)
  return bIndex - aIndex;
}

function pushToCategory<T>(
  map: CategoryMap<T>,
  category: CategoryKey,
  key: string,
  node: T
) {
  const categoryMap = map.get(category);
  if (!categoryMap) return;

  // Set the key as a plan empty array
  if (!categoryMap.has(key)) {
    categoryMap.set(key, []);
  }

  categoryMap.get(key)!.push(node);
}

function sortAllCategories<T extends PhotographyMediaFileWithMetadata>(
  map: CategoryMap<T>
) {
  for (const [, categoryMap] of map) {
    for (const [, value] of categoryMap) {
      value.sort(sortMedia);
    }
  }
}

async function writeMapToFile<T extends PhotographyMediaFileWithMetadata>(
  map: CategoryMap<T>
) {
  // define path to write
  const categoryDir = path.resolve(process.cwd(), "product-data/photography");

  // ensure the directory exists,
  await fs.mkdir(categoryDir, { recursive: true });

  // Define the targefFile pathe where the byCategory map will be written into a single JSON file
  const targetFile = path.join(categoryDir, "byCategory.json");

  // Convert the map into a plain Object structure
  const mapAsObject: Record<string, Record<string, T[]>> = {};

  for (const [category, categoryMap] of map) {
    // convert the inner map (key -> T[]) into an object
    mapAsObject[category] = Object.fromEntries(categoryMap);
  }

  // Prepare the doc
  const doc = mapAsObject;

  // Write the file
  await fs.writeFile(targetFile, JSON.stringify(doc, null, 2), "utf-8");

  console.log(`Wrote byCategory contents -> ${targetFile}`);
}

// Run the script
async function run() {
  const allMedia = await loadMedia();

  // Create data structure to hold all photography files
  const byCategory: CategoryMap = new Map([
    ["filmFormat", new Map()],
    ["cameraBody", new Map()],
    ["lens", new Map()],
    ["filmStock", new Map()],
  ]);

  // iterate through each node and push it to map by the handle
  for (const node of allMedia) {
    const url = extractUrl(node);
    if (!url) continue;

    // filtering urls to make sure only photography images are being processed
    if (url.indexOf("photography") !== -1) {
      const fileName = filenameFromUrl(url);
      const {
        fileType,
        date,
        index,
        filmFormat,
        cameraBody,
        lens,
        filmStockBrand,
        isoNumber,
        aperture,
        sanitizedShutterspeed,
      } = parseMeta(fileName);

      // adding metadata to metafield for easier processing in hydrogen app
      const meta = {
        fileType: fileType,
        date: date,
        index: index,
        filmFormat: filmFormat,
        cameraBody: cameraBody,
        lens: lens,
        filmStockBrand: filmStockBrand,
        isoNumber: isoNumber,
        aperture: aperture,
        shutterspeed: sanitizedShutterspeed,
      };

      node.meta = meta;

      let filmStockBrandAndIso;

      if (filmStockBrand === "45mp") {
        filmStockBrandAndIso = "45mp";
      } else {
        filmStockBrandAndIso = filmStockBrand + "-" + isoNumber;
      }

      // pushing nodes to map by category and subcategory
      pushToCategory(byCategory, "cameraBody", cameraBody, node);
      pushToCategory(byCategory, "filmFormat", filmFormat, node);
      pushToCategory(byCategory, "filmStock", filmStockBrandAndIso, node);
      pushToCategory(byCategory, "lens", lens, node);
    }

    // sort media files by date and index per subcategory
    sortAllCategories(byCategory);
  }
  // write map to file
  writeMapToFile(byCategory);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
