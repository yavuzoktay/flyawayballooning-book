const requestedImageUrls = new Set();

export const preloadImageUrls = (urls = [], options = {}) => {
  if (typeof window === "undefined" || typeof window.Image === "undefined") {
    return;
  }

  const limit =
    typeof options.limit === "number" && options.limit > 0
      ? options.limit
      : urls.length;

  Array.from(new Set(urls.filter(Boolean)))
    .slice(0, limit)
    .forEach((url) => {
      if (requestedImageUrls.has(url)) {
        return;
      }

      requestedImageUrls.add(url);
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
    });
};

export const getPriorityImageProps = (index, eagerCount = 2) => {
  const shouldPrioritize = index < eagerCount;

  return {
    loading: shouldPrioritize ? "eager" : "lazy",
    fetchPriority: shouldPrioritize ? "high" : "auto",
    decoding: "async",
  };
};
