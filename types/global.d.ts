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

export type ProductData = {
  id: string;
  handle: string;
  title: string;
  status: string;
  productType: string;
  tags: Array<{ string }>;
  descriptionHtml: string;
  metafields: Array<{
    namespace: string;
    key: string;
    type: string;
    value: string;
  }>;
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
          width: number;
          height: number;
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

export type AdminImageWithMetadata = AdminImage & {
  meta: {
    date: Date;
    imageType: string;
    index: number;
  };
};

export type ProductImageProps = {
  image: ProductVariantFragment["image"];
  key: string | number;
  alt: string;
  id: string;
  className?: string;
};
