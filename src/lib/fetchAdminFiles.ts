import type { FilesResponse, AdminFile } from "types/global";
import { client } from "./newClientInstance";

export async function fetchAdminFiles(): Promise<AdminFile[]> {
  const query = `{
    files(first: 250) {
      edges {
        node {
          alt
          ... on Model3d {
            sources {
              url
              format
              mimeType
            }
          }
          ... on GenericFile {
            url
          }
          ... on MediaImage {
            image {
              url
              width
              height
            }
          }
          ... on Video {
            duration
            preview {
              status
              image {
                url
                width
                height
              }
            }    
            originalSource {
              url
              width
              height
              format
              mimeType
            }
            sources {
              url
              width
              height
              format
              mimeType
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
