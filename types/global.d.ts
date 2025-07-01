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
        metafields: {
          nodes: Array<{
            namespace: string;
            key: string;
            value: string;
            type: string;
          }>;
        };
      };
    }>;
  };
}

export type ProductData = {
  id: string;
  title: string;
  status: string;
  productType: string;
  tags: string;
  descriptionHtml: string;
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
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
