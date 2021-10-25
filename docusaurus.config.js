const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "布蕾组Blaze",
  tagline: "Blaze the trail",
  url: "https://blaze.inexbot.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "inexbot", // Usually your GitHub org/user name.
  projectName: "blaze", // Usually your repo name.
  // plugins: ["@docusaurus/plugin-google-analytics"],
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // editUrl:
          //   "https://github.com/facebook/docusaurus/edit/main/website/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // editUrl:
          //   "https://github.com/facebook/docusaurus/edit/main/website/blog/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      googleAnalytics: {
        trackingID: "G-LBCN9FERYM",
        anonymizeIP: false,
      },
      navbar: {
        title: "布蕾组Blaze",
        logo: {
          alt: "inexbot",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "doc",
            docId: "intro",
            position: "left",
            label: "文档",
          },
          { to: "/blog", label: "Blog", position: "left" },
          {
            href: "https://open.inexbot.com",
            label: "NexDroid二次开发",
            position: "right",
          },
          {
            href: "https://github.com/inexbot/Blaze",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "相关",
            items: [
              {
                label: "纳博特科技",
                href: "https://www.inexbot.com",
              },
              {
                label: "NexDroid二次开发",
                href: "https://open.inexbot.com",
              },
            ],
          },
          {
            title: "更多",
            items: [
              {
                label: "gitee",
                href: "https://gitee.com/nj_inexbot/blaze",
              },
            ],
          },
        ],
        copyright: `Copyright © 2021 inexbot`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};
