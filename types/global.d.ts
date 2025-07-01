export interface ProductsResponse {
  products: {
    edges: Array<{ node: { id: string; title: string } }>;
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
