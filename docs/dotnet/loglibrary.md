---
sidebar_position: 3
---

# 日志记录(log)库

这是在开发.NET 桌面端软件时捎带做的一个基于 XML 文件的 log 记录库。使用非常简单，可满足自定义的需求。

建议使用 Nuget 来安装[XmlLogLibrary 库](https://www.nuget.org/packages/XmlLogLibrary/)。

任何使用问题或 Bug？请联系weifan@inexbot.com

## 开源

[GitHub](https://github.com/inexbot/XmlLogLibrary)

欢迎 Fork 和 Pull requests！

## 使用前提

推荐使用 Visual Studio 2019。

当前库仅支持.NET Core 3.1 和.NET 5 框架。请在创建项目时使用相应框架的 WPF 开发方式。

## 安装及使用

### 安装库

在[Nuget](https://www.nuget.org/packages/XmlLogLibrary/)中安装。

或在 Visual Studio 中安装

`Install-Package XmlLogLibrary`

### 使用

```csharp
using System.IO;
using XmlLogLibrary;

namespace YourProject
{
    //在窗口中使用
    public partial class MainWindow
    {
        XmlLog log = XmlLog.Instance;
        public MainWindow()
        {
            InitializeComponent();
            log.InitLog(); //使用默认参数初始化Log，仅需初始化一次;
            //Log.InitLog(Directory.GetCurrentDirectory()+"\\log","mylog",1024*1024); 自定义log位置、名称和大小
            log.AddLog("软件打开", "local", "1"); //记录内容“软件打开”，类型可以自定义"local"还是"来自控制器",最后一个是重要性，这里重要性如何定义取决于您自己，可以写“重要”，“Important”
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            //控制器的默认端口为6000，不可与其它示教器共存
            log.AddLog("点击了按钮！", "交互", "普通");
        }

        private void Button1_Click_1(object sender, RoutedEventArgs e)
        {
            List<LogBase> logs = log.LogList; //获取log列表。
            Console.WriteLine(logs[0].data);//获取第一条log的内容。
        }

        protected override void OnClosing(CancelEventArgs e)
        {
            base.OnClosing(e);
            log.AddLog("软件关闭！", "local", "2");
        }
    }
}
```
