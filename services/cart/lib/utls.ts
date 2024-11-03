export function parseCartItems(itemObj: Record<string, string>) {
  return Object.entries(itemObj).map((e) => {
    const [_key, value] = e;

    return { ...JSON.parse(value) };
  });
}
