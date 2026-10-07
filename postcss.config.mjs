import UnoCSS from "@unocss/postcss";
import { presetWind3 } from "unocss";

const config = {
  content: {
    filesystem: ["src/**/*.{html,js,ts,jsx,tsx}"],
  },
  presets: [presetWind3()],
};

export default {
  plugins: [UnoCSS({ configOrPath: config })],
};
