import { mount } from "./ui/app";

const el = document.getElementById("app");
if (!el) throw new Error("#app missing");
mount(el);
