export function parseCartItems(itemObj: Record<string, string>) {
  return Object.entries(itemObj).map((e) => {
    const [key, value] = e;

    return { productId: key, ...JSON.parse(value) };
  });
}
