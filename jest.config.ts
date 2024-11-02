import type { Config } from "@jest/types"

const jestConfig: Config.InitialOptions = {
  // [...],
  preset: "ts-jest/presets/default-esm", // or other ESM presets
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        // ts-jest configuration goes here
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  watchPathIgnorePatterns: ["<rootDir>/node_modules", "<rootDir>/.git", "<rootDir>/.*~"]
}

export default jestConfig;
