import { useEffect, useState } from "react";

const readDarkMode = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(readDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    const observer = new MutationObserver(update);

    update();
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

export default useDarkMode;
