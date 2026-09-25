import { fade } from "astro:transitions";

export const siteHeaderTransition = () => fade({ duration: "0.18s" });
export const siteContentTransition = () => fade({ duration: "0.22s" });
