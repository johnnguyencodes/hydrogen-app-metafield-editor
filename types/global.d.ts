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
        image: {
          url: string;
        };
      };
    }>;
  };
}

export type AdminFile = {
  alt: string;
  image: {
    url: string;
  };
};
