import { hydrateRoot } from "react-dom/client";
import App from "./App";
import type { PagePayload } from "./app-types";
import "./styles.css";

const { profile, ...data } = JSON.parse(document.getElementById("page-data")!.textContent!) as PagePayload;
hydrateRoot(document.getElementById("root")!, <App data={data} profile={profile} />);
