---
sidebar_position: 1
---

# 网络通讯库

为了方便.NET 开发者制作基于[NexDroid 控制系统](http://www.inexbot.com/product/content?id=35&num=0&type=controlSys)的桌面端软件，我们基于.NET 封装了网络通讯库“NrcTcpLibrary”，仅需简单调用即可向控制器收发数据。

[GitHub](https://github.com/inexbot/NrcTcpLibrary)

欢迎 Fork 和 Pull requests！

任何使用问题或 Bug？请联系weifan@inexbot.com

建议使用 Nuget 来安装[NrcTcpLibrary 库](https://www.nuget.org/packages/NrcTcpLibrary/)。

## 使用前提

推荐使用 Visual Studio 2019。

当前库仅支持.NET Core 3.1 和.NET 5 框架。请在创建项目时使用相应框架的 WPF 开发方式。

## 安装及使用

### 安装库

在[Nuget](https://www.nuget.org/packages/NrcTcpLibrary/)中安装。

或在 Visual Studio 中安装

`Install-Package NrcTcpLibrary`

### 使用

```csharp
using NrcTcpLibrary

namespace YourProject
{
    class Client
    {
        private readonly static object lockObj = new object();
        private static Client instance = null;
        //单实例
        public static Client GetInstance()
        {
            if (instance == null)
            {
                lock (lockObj)
                {
                    if (instance == null)
                    {
                        instance = new Client();
                    }
                }
            }
            return instance;
        }
        //需要将处理接收消息的类传入
        public ClientBase clientBase = ClientBase.GetInstance(new HandleReceiveMessage());
        public void Connect(string ip,int port)
        {
            Task.Run(() => clientBase.RunClientAsync(ip, port));
        }
        //发送消息的方法，data数据段可以支持string或byte[]
        public void SendMessage(int command,string data)
        {
            clientBase.SendMessage(command, data);
        }
        public void SendMessage(int command,byte[] data)
        {
            clientBase.SendMessage(command, data);
        }
    }
    // 用来处理控制器发过来的数据和连接状态
    public class HandleReceiveMessage:MessageHandler
    {
        public HandleReceiveMessage()
        {
        }
        //过来的消息处理
        public override void Handler(Message message)
        {
            int command = message.command;
            string data = message.data;
            doSomethine(command,data)
        }
        public override void ConnectState(bool state)
        {
            //拿到连接状态之后干什么事儿
            do sth to state;
        }
    }
    //在窗口中使用
    public partial class MainWindow
    {
        Tcp.Client client = Tcp.Client.GetInstance();
        public MainWindow()
        {
            InitializeComponent();
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            //控制器的默认端口为6000，不可与其它示教器共存
            client.Connect("ip地址", 6000);
        }

        private void Button1_Click_1(object sender, RoutedEventArgs e)
        {
            client.SendMessage(0x5565,"sth");
        }

        protected override void OnClosing(CancelEventArgs e)
        {
            if (client.clientBase.clientChannel != null && client.clientBase.clientChannel.Active)
            {
                client.clientBase.clientChannel.CloseAsync();
            }
            base.OnClosing(e);
        }
    }
}
```
