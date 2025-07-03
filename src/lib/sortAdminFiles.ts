import type { AdminImage, AdminImageWithMetadata } from "types/global";
import { promises as fs } from "node:fs";
import path from "path";

async function mediaMetafieldSync() {
  // read through the master product json data and chunk it out to individual product json files.
  try {
    const masterMediaPath = path.resolve(
      process.cwd(),
      "output/master-media.json"
    );
    const jsonData = await fs.readFile(masterMediaPath, "utf-8");
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

// {
//   "alt": "first glamour shot",
//   "image": {
//     "url": "https://cdn.shopify.com/s/files/1/0934/9293/6987/files/plants--mammillaria-crucigera-tlalocii-3--2025-05-25--carousel--001.webp"
//   },
//   "meta": {
//     "date": "2025-05-25",
//     "imageType": "carousel",
//     "index": 1
//   }
// },

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
function filterPlantImagesByHandle(
  adminImageData: AdminImage[],
  productHandle: string
) {
  return adminImageData.filter((img) =>
    img.image?.url?.includes(`plants--${productHandle}`)
  );
}

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
function addImageMetadata(img: AdminImage): AdminImageWithMetadata {
  const regex = /--(\d{4}-\d{2}-\d{2})--([a-z]+)--(\d{3})\./;
  const match = img.image.url.match(regex);

  if (!match) {
    return {
      ...img,
      meta: {
        date: new Date(0),
        imageType: "",
        index: 0,
      },
    };
  }

  const [, dateStr, imageType, indexStr] = match;

  return {
    ...img,
    meta: {
      date: new Date(dateStr),
      imageType,
      index: parseInt(indexStr, 10),
    },
  };
}

function sortImagesWithMetadata(
  a: AdminImageWithMetadata,
  b: AdminImageWithMetadata
): number {
  const { date: aDate, imageType: aImageType, index: aIndex } = a.meta;
  const { date: bDate, imageType: bImageType, index: bIndex } = b.meta;

  // 1. Sort by date (most recent first)
  const aDateObj = new Date(aDate);
  const bDateObj = new Date(bDate);

  if (bDateObj.getTime() !== aDateObj.getTime()) {
    return bDateObj.getTime() - aDateObj.getTime();
  }

  // 2. Sort by imageType alphabetically
  if (aImageType !== bImageType) {
    return aImageType.localeCompare(bImageType);
  }

  // 3. Sort by index from lowest to highest
  return aIndex - bIndex;
}
