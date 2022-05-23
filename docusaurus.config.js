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
        googleAnalytics: {
          trackingID: "G-LBCN9FERYM",
          anonymizeIP: false,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
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
            href: "https://www.openroboticsalliance.com",
            label: "开放机器人联盟",
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
                label: "纳博特南京科技有限公司",
                href: "https://www.inexbot.com",
              },
              {
                label: "开放机器人联盟",
                href: "https://www.openroboticsalliance.com",
              },
            ],
          },
          {
            title: "更多",
            items: [
              {
                label: "Docusaurus",
                href: "https://www.docusaurus.cn/",
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
