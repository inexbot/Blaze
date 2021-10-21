import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

const FeatureList = [
  {
    title: "机器人应用",
    Svg: require("../../static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <>
        探索更多机器人应用，例如手柄、平板、手机等设备在工业机器人应用中的角色。
      </>
    ),
  },
  {
    title: "前端技术",
    Svg: require("../../static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>探索React/Vue.js/nuxt.js等H5技术与.NET等前端技术在机器人行业的应用。</>
    ),
  },
  {
    title: "测试方法",
    Svg: require("../../static/img/undraw_docusaurus_react.svg").default,
    description: <>探索工业机器人领域针对控制系统、本体的高效测试方法。</>,
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      {/* <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div> */}
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
