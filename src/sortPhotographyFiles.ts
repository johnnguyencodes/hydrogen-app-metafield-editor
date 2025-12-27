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
    shutterspeed,
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
  if (!categoryMap.has(key)) {
    categoryMap.set(key, { nodes: [] });
  }

  categoryMap.get(key)!.nodes.push(node);
}

function sortAllCategories<T extends PhotographyMediaFileWithMetadata>(
  map: CategoryMap<T>
) {
  for (const [, categoryMap] of map) {
    for (const [, value] of categoryMap) {
      value.nodes.sort(sortMedia);
    }
  }
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
        shutterspeed,
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
        shutterspeed: shutterspeed,
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

  // write the nodes of each subCategory to their own JSON file inside their respective category folders
  for (const [category, subMap] of byCategory) {
    const categoryDir = path.resolve(
      process.cwd(),
      "product-data/photography",
      category
    );

    // ensure category directory exists
    await fs.mkdir(categoryDir, { recursive: true });

    // iterate through each subKey and inject the image nodes into the subKey's JSON file
    for (const [subKey, { nodes }] of subMap) {
      const targetFile = path.join(categoryDir, `${subKey}.json`);

      let doc: NodeGroup = { nodes: [] };

      // try reading an existing file.  if it doesn't exist, ignore the error
      try {
        const fileText = await fs.readFile(targetFile, "utf-8");
        doc = JSON.parse(fileText) as NodeGroup;
      } catch (err: any) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }

      // Inject / overwrite nodes
      doc.nodes = nodes;

      // write the doc back to the json file
      await fs.writeFile(targetFile, JSON.stringify(doc, null, 2), "utf-8");

      console.log(
        `Wrote ${nodes.length} items -> product-data/photography/${category}/${subKey}.json`
      );
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
