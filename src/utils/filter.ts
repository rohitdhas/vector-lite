export function matchesFilter(
  metadata: Record<string, any> = {},
  filter: Record<string, any> = {}
): boolean {
  for (const key in filter) {
    const condition = filter[key];
    const value = metadata[key];

    if (typeof condition === "object" && condition !== null) {
      for (const op in condition) {
        const operand = condition[op];
        switch (op) {
          case "$eq":
            if (value !== operand) return false;
            break;
          case "$gt":
            if (!(value > operand)) return false;
            break;
          case "$lt":
            if (!(value < operand)) return false;
            break;
          case "$in":
            if (!Array.isArray(operand) || !operand.includes(value))
              return false;
            break;
          default:
            return false;
        }
      }
    } else {
      if (value !== condition) return false;
    }
  }

  return true;
}
