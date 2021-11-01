---
sidebar_position: 1
---

# PC 调试软件（示例）

我们使用.NET 5 做了一个 wpf 的 NexDroid PC 调试软件，仅做了部分机器人参数和变量等界面用作参考。

您可以下载 Demo 示例试用，当然我们更加欢迎您通过示例代码进行再开发！

[Demo 下载](https://inexbot-use.oss-cn-shanghai.aliyuncs.com/ipd/net5.0-windows.zip) (更新日期 2021-11-01)

<img src="/img/dotnet/ipd-2.png" />

一些开发经验会在 Blaze 的 [Blog](https://blaze.inexbot.com/blog) 和<strong>纳博特科技 Inexbot</strong>公众号中分享！

<img src="/img/inexbotqrcode.jpg" width="350px" align="center" />

## 更新

- 11 月 1 日 - 在调试菜单中增加 OPC-UA 支持。当且仅当您的控制器为最新支持 OPC-UA 的版本时可用。

## 开源

[GitHub](https://github.com/inexbot/IPD)

欢迎 Fork 和 Pull requests！

## Demo 使用

下载并运行 IPD.exe

1. 点击上方菜单栏的连接按钮，输入控制器的 IP 和端口号（6000），连接成功后关闭对话框;
   <img src="/img/dotnet/ipd-1.png" />
2. 不可点击的按钮就是没有开发的;
   <img src="/img/dotnet/ipd-3.png" />
3. 点击上方的按钮切换界面。
   <img src="/img/dotnet/ipd-4.png" />

## 项目说明

本项目使用部分 MVVM 模式，获取数据并更新界面采用 MVVM 模式 Binding 到控件，提交数据采用控件后台代码直接获取控件内容并发送的方式。

### 代码使用

1. clone 或下载项目；
2. 使用 Visual Studio 2017/2019 或更新的版本打开项目 IPD.csproj
3. 生成并运行程序。

### 目录结构

| 目录/文件          | 作用                                       |
| ------------------ | ------------------------------------------ |
| IPD.csproj         | 项目文件                                   |
| App.xaml           | 程序主 xaml 文件                           |
| App.xaml           | 程序主 xaml 文件的后台代码，主要做资源引入 |
| MainWindow.xaml    | 主窗口 xaml 文件                           |
| MainWindow.xaml.cs | 主窗口后台代码                             |
| Resource.resx      | 资源文件                                   |
| Common             | Model、Command 等类型的基类                |
| Component          | 自定义控件后台代码                         |
| Converter          | 类型转换器                                 |
| Data               | 存储常用数据的 xml 文件                    |
| Dialogs            | 关于、点动、示波器等对话框                 |
| Model              | ViewModel，用来接收和保存控制器数据        |
| Resource           | 资源文件                                   |
| Tcp                | 网络通讯                                   |
| Themes             | 自定义控件的 xaml                          |
| Util               | 一些常用函数                               |
| View               | 各个界面                                   |

### 简要开发说明

- Ribbon

本项目采用了 FluentRibbon 库，像 Word 等软件一样上方有菜单导航栏，它在 View 下的 RibbonBar 目录下。

- 接收数据

接收数据需先在 Model 中的 HandleReceiveMessage.cs 文件中增加相应的命令字，并自行建立 ViewModel，在控件中绑定。

- 其它

请关注<strong>纳博特科技 Inexbot</strong>微信公众号，我们会在里面分享更多开发经验。
