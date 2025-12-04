function containsPhone(x: any): boolean {
  try {
    if (!x) return false;
    if (Array.isArray(x)) return x.some((i) => containsPhone(i));
    if (typeof x === "object") {
      if (Object.prototype.hasOwnProperty.call(x, "phone") && x.phone) return true;
      for (const k of Object.keys(x)) {
        if (containsPhone((x as any)[k])) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function shouldBlock(args: any[]): boolean {
  try {
    return args.some((a) => containsPhone(a));
  } catch {
    return false;
  }
}

if (import.meta.env.PROD) {
  const wrap = (fn: any) => (...args: any[]) => {
    if (shouldBlock(args)) return;
    fn(...args);
  };
  console.log = wrap(console.log);
  console.table = wrap(console.table);
  console.dir = wrap(console.dir);
}

