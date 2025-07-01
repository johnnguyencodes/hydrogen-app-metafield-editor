export interface ProductsResponse {
  products: {
    edges: Array<{ node: { id: string; title: string } }>;
  };
}
