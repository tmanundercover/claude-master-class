import { hydrateRoot } from "react-dom/client";
import App from "./App";
import type { PageData } from "./app-types";
import "./styles.css";

const data = JSON.parse(document.getElementById("page-data")!.textContent!) as PageData;
hydrateRoot(document.getElementById("root")!, <App data={data} />);
