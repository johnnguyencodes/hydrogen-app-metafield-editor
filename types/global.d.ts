export interface ProductsResponse {
  products: {
    edges: Array<{
      node: {
        title: string;
        productType: string;
        tags: string;
        descriptionHtml: string;
        id: string;
        status: string;
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
