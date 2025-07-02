import type { FilesResponse, AdminFile } from "types/global";
import { client } from "./newClientInstance";

export async function fetchAdminFiles(): Promise<AdminFile[]> {
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

    const adminFiles: AdminFile[] = data.files.edges.map((edge) => edge.node);

    console.log(`Found ${adminFiles.length} files`);
    return adminFiles;
  } catch (err: any) {
    console.error("Connection failed:", err.response?.errors || err.message);
    process.exit(1);
  }
}
