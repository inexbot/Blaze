---
sidebar_position: 4
---

# H5 示教器

这是我们最早的 H5 项目，经历了近 1 年的摸索尝试，途经多次改版、重构，现在已经能够支持大部分示教器功能。

该程序可以内置于控制器中，任意设备（推荐平板）可以通过浏览器访问控制器 IP 来打开该 H5 程序操作机器人。

[试用下载](https://inexbot-use.oss-cn-shanghai.aliyuncs.com/h5hmi/h5hmi.zip)

## 截图

<img src="/img/h5projects/h5hmi1.png" align="center" />

<img src="/img/h5projects/h5hmi2.png" align="center" />

## 网络通讯

由于浏览器的限制，H5 程序仅能通过 WebSocket 通过第三方程序中转而非直接通过 Tcp/Socket 与控制器进行通讯。

具体的 WebSocket 通讯协议与中转程序可以参阅 [WebSocket 文档](/docs/h5projects/WebSocket)

## 技术栈

- [React - 用于构建用户界面的 JavaScript 库](https://react.docschina.org/)
- [UmiJs - 🍙 插件化的企业级前端应用框架。](https://umijs.org/zh-CN)
- [DvaJs - dva 是一个基于 redux 和 redux-saga 的数据流方案](https://dvajs.com/)
- [Ant Design - 企业级产品设计体系，创造高效愉悦的工作体验](https://ant.design/index-cn)

## 使用

1. 控制器连接互联网
2. 安装 nginx、unzip `sudo apt-get install nginx unzip`
3. 修改 nginx 的配置文件`/etc/nginx/sites-available/default`，将其中的`root`指向`/home/inexbot/h5hmi`
4. 将下载的 h5hmi.zip 中所有文件解压到`/home/inexbot/h5hmi`
5. 将在 [Websocket 文档](/docs/h5projects/WebSocket)中获得的中转程序 TBServer.zip 都解压到`/home/inexbot/TBServer`
6. 修改文件权限`sudo chmod 777 /home/inexbot/TBServer/serve/TBServer /home/inexbot/TBServer/serve/TBServer.sh`
7. 修改`/etc/profile`文件和`/home/inexbot/.bashrc`文件，在他们的最后一行都加上`export QT_QPA_PLATFORM='offscreen'`
8. 执行`/home/inexbot/TBServer/serve/TBServer.sh`，平板或电脑浏览器浏览控制器 ip
