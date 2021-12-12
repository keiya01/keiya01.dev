export const loadScript = (
  src: string,
  shouldLoadScript: () => boolean,
  option?: { crossOrigin?: string }
): Promise<boolean> => {
  if (!shouldLoadScript()) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    if (option?.crossOrigin) {
      script.crossOrigin = option.crossOrigin;
    }
    script.onload = () => resolve(true);
    document.body.appendChild(script);
  });
};
