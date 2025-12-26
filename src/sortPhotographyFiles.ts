import type {
  PhotographyMediaFileWithMetadata,
  CategoryKey,
  CategoryMap,
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

      pushToCategory(byCategory, "filmFormat", filmFormat, node);
      pushToCategory(byCategory, "cameraBody", cameraBody, node);
      pushToCategory(byCategory, "lens", lens, node);
      pushToCategory(byCategory, "filmStock", filmStockBrandAndIso, node);
    }

    // sort media files by date and index per subcategory
    sortAllCategories(byCategory);
  }

  for (const [category, subMap] of byCategory) {
    console.group(`Category: ${category}`);

    for (const [subKey, { nodes }] of subMap) {
      console.log(`Subcategory: ${subKey}`, nodes);
    }

    console.groupEnd();
  }

  // // sorting metafields by category, date, index
  // for (const [_handle, { productType: _productType, nodes }] of byCategory) {
  //   nodes.sort(sortMedia);
  // }

  // // due to the recursive flag, this ensures the target directory
  // // already exists, by either making the directory or silently exiting
  // await fs.mkdir(path.resolve(process.cwd(), "output"), { recursive: true });

  // // write the media metafields to their own json file
  // for (const [handle, { productType, nodes }] of byHandle) {
  //   const targetFile = path.resolve(
  //     process.cwd(),
  //     `product-data/${productType}`,
  //     `${handle}.json`
  //   );

  //   // container for product data
  //   let doc: ProductData;

  //   try {
  //     // if the file already exists, load and parse it
  //     const fileText = await fs.readFile(targetFile, "utf-8");
  //     doc = JSON.parse(fileText) as ProductData;
  //   } catch (err: any) {
  //     if (err.code === "ENOENT") {
  //       // if the file is missing, find the product in master-data.json by handle:
  //       const seed = allProductData.find(
  //         (product) => product.handle === handle
  //       );

  //       if (!seed) {
  //         throw new Error(
  //           `No product with handle ${handle} in output/master-product.json`
  //         );
  //       }

  //       // then load the product data into product data container
  //       doc = JSON.parse(JSON.stringify(seed));
  //     } else {
  //       throw err;
  //     }
  //   }

  //   // find the mediaMetafield
  //   const mediaMetafield = doc.metafields.find(
  //     (metafield) => metafield.key === "images"
  //   );

  //   // then inject or overwrite the images metafield
  //   if (mediaMetafield) {
  //     mediaMetafield.value = nodes;
  //   } else {
  //     doc.metafields.push({
  //       namespace: "plant",
  //       key: "images",
  //       type: "json",
  //       value: nodes,
  //     });
  //   }

  //   // finally, write the doc to the json file
  //   await fs.writeFile(targetFile, JSON.stringify(doc, null, 2), "utf-8");
  //   console.log(`Injected ${nodes.length} items into ${targetFile}`);
  // }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
