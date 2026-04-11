const path = require("path");
const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    prune: true,
    icon: path.join(__dirname, "assets", "fawtartak"),
    ignore: [
      /^\/src($|\/)/,
      /^\/public($|\/)/,
      /^\/out($|\/)/,
      /^\/dist_electron($|\/)/,
      /^\/node_modules\/\.cache($|\/)/,
      /^\/\.git($|\/)/,
      /^\/\.github($|\/)/,
      /^\/README\.md$/,
      /^\/workflow\.txt$/,
      /^\/index\.html$/,
      /^\/eslint\.config\.js$/,
      /^\/postcss\.config\.js$/,
      /^\/tailwind\.config\.js$/,
      /^\/vite\.config\.js$/,
      /^\/scripts($|\/)/,
      /^\/main_prod\.cjs$/,
      /^\/preload\.cjs$/,
      /^\/preload\.js$/,
      /^\/package-lock\.json$/,
      /^\/.*\.log$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "FawtartakPOS",
        exe: "FawtartakPOS.exe",
        setupExe: "FawtartakPOSSetup.exe",
        setupIcon: path.join(__dirname, "assets", "fawtartak.ico"),
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
