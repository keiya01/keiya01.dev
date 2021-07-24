import { globalStyle } from "@vanilla-extract/css";

globalStyle("body", {
  margin: 0,
  minHeight: "100%",
  height: "100%",
  width: "100%",
  backgroundColor: "#280042",
});

globalStyle("h1, h2, h3, h4", {
  color: "#fff",
  padding: "0 0 6px",
  margin: "10px 0",
  width: "100%",
  borderBottom: "1px solid #fff",
});

globalStyle("h1", {
  fontSize: 20,
});

globalStyle("h2", {
  fontSize: 18,
});

globalStyle("h3", {
  fontSize: 16,
});

globalStyle("p", {
  fontSize: 16,
  color: "#fff",
  lineHeight: 1.2,
});
