import type { FilesResponse } from "types/global";
import { client } from "./newClientInstance";

export async function fetchPlantFilesFromAdmin(): Promise<
  Array<{ alt: string; image: { url: string } }>
> {
  const query = `{
    files(first: 100) {
      edges {
        node {
          ... on MediaImage {
            alt
            image {
              url
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await client.request<FilesResponse>(query);

    if (!response.data) {
      throw new Error("No response data from Shopify");
    }

    const data = response.data;

    const plantImages = data.files.edges
      .map((edge) => edge.node)
      .filter((file) => file.image.url.includes("plants--"));

    console.log(`Found ${plantImages.length} plant image files`);
    return plantImages;
  } catch (err: any) {
    console.error("Connection failed:", err.response?.errors || err.message);
    process.exit(1);
  }
}
