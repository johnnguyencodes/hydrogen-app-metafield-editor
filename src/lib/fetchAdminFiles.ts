import type { FilesResponse, AdminFile } from "types/global";
import { client } from "./newClientInstance";

export async function fetchAdminFiles(): Promise<AdminFile[]> {
  const allFiles: AdminFile[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  const query = `
    query getFiles($first: Int!, $after: String) {
      files(first: $first, after: $after) {
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
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }`;

  try {
    while (hasNextPage) {
      const response = await client.request<FilesResponse>(query, {
        variables: {
          first: 250,
          after: endCursor,
        },
      });

      if (!response.data) {
        throw new Error("No response data from Shopify");
      }

      const data = response.data;
      const adminFiles: AdminFile[] = data.files.edges.map((edge) => edge.node);

      allFiles.push(...adminFiles);

      hasNextPage = data.files.pageInfo.hasNextPage;
      endCursor = data.files.pageInfo.endCursor;
    }

    console.log(`Found a total of ${allFiles.length} files`);
    return allFiles;
  } catch (err: any) {
    console.error("Connection failed:", err.response?.errors || err.message);
    process.exit(1);
  }
}
