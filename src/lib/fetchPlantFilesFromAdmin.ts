import type { PlantImage, FilesResponse } from "types/global";
import { client } from "./newClientInstance";

export async function fetchPlantFilesFromAdmin(): Promise<PlantImage[]> {
  const query = `{
    files(first: 250) {
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

    const plantImages: PlantImage[] = data.files.edges
      .map((edge) => edge.node)
      .filter((file) => file.image.url.includes("plants--"));

    console.log(`Found ${plantImages.length} plant image files`);
    return plantImages;
  } catch (err: any) {
    console.error("Connection failed:", err.response?.errors || err.message);
    process.exit(1);
  }
}
