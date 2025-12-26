export interface ProductsResponse {
  products: {
    edges: Array<{
      node: {
        id: string;
        handle: string;
        title: string;
        status: string;
        productType: string;
        tags: Array<{ string }>;
        descriptionHtml: string;
        metafields: {
          nodes: Array<{
            namespace: string;
            key: string;
            type: string;
            value: string;
          }>;
        };
      };
    }>;
  };
}

export interface MetafieldValue {
  namespace: string;
  key: string;
  type: string;
  value: string | MediaFileWithMetadata[];
}

export type ProductData = {
  id: string;
  handle: string;
  title: string;
  status: string;
  productType: string;
  tags: Array<{ string }>;
  descriptionHtml: string;
  metafields: MetafieldValue[];
};

export interface FilesResponse {
  files: {
    edges: Array<{
      node: {
        alt: string;
        url?: string;
        image?: {
          url: string;
          width: number;
          height: number;
        };
        duration?: number;
        preview?: {
          status: string;
          image: {
            url: string;
            width: number;
            height: number;
          };
        };
        originalSource?: {
          url: string;
          width: number;
          height: number;
          format: string;
          mimeType: string;
        };
        sources?: Array<{
          url: string;
          width?: number;
          height?: number;
          format: string;
          mimeType: string;
        }>;
      };
    }>;
  };
}

export type AdminFile = FilesResponse["files"]["edges"][number]["node"];

export type AdminImage = {
  id: string;
  alt: string;
  image: {
    url: string;
  };
};

export type MediaFileWithMetadata = AdminFile & {
  meta: {
    category: string;
    date: Date;
    index: number;
    ext: string;
  };
};

export type PhotographyMediaFileWithMetadata = AdminFile & {
  meta: {
    filetype: string;
    date: Date;
    index: number;
    filmFormat: string;
    cameraBody: string;
    lens: string;
    filmStockBrand: string;
    isoNumber: string;
    aperture: string;
    shutterspeed: string;
  };
};

export type ProductImageProps = {
  image: ProductVariantFragment["image"];
  key: string | number;
  alt: string;
  id: string;
  className?: string;
};

export type FilesQueryResult = {
  files: {
    edges: { cursor: string; node: AdminFile }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

type NodeGroup<T = any> = {
  nodes: T[];
};

type CategoryKey = "filmFormat" | "cameraBody" | "lens" | "filmStock";

type CategoryMap<T = any> = Map<CategoryKey, Map<string, NodeGroup<T>>>;
