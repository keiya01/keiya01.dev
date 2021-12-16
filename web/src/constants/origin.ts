export const ORIGIN = "https://blog.keiya01.dev";
export const WORKER_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://blog.keiya01.workers.dev"
    : "http://127.0.0.1:8787";
