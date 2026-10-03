import { createRoot } from "react-dom/client";
import { Studio } from "@/components/studio/studio";
import "@/styles.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<Studio />);
