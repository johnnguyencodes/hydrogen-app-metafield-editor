export interface ProductsResponse {
  products: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        status: string;
        productType: string;
        tags: string;
        descriptionHtml: string;
        metafields: Array<{
          node: { namespace: string; key: string; value: string; type: string };
        }>;
      };
    }>;
  };
}

export interface FilesResponse {
  files: {
    edges: Array<{
      node: {
        alt: string;
        image: {
          url: string;
        };
      };
    }>;
  };
}

export type PlantImage = {
  alt: string;
  image: {
    url: string;
  };
};
