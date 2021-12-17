import { loadScript } from "../fundamentals/loadScript";

const loadGoogleAdScript = () => {
  loadScript(
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3516148173857150",
    () => !!document.querySelector("ins.adsbygoogle"),
    { crossOrigin: "anonymous" }
  );
};

loadGoogleAdScript();
