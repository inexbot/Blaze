---
slug: about-dotnetty
title: DotNetty的应用
authors: [inexbot]
tags: [blaze, 纳博特科技, 工业机器人, 布蕾组, .NET]
---

## 什么是 DotNetty

在 Inexbot PC Debugger 项目中，我们使用 DotNetty 封装了 [NrcTcpLibrary](https://github.com/inexbot/NrcTcpLibrary) 库用来接收和处理来自 NexDroid 控制器的数据。

> <strong>Netty 是什么</strong>
>
> Netty 是一款用于创建高性能网络应用程序的高级框架。
>
> Netty 是一款异步的事件驱动的网络应用程序框架，支持快速地开发可维护的高性能的面向协议的服务器和客户端
>
> <strong>DotNetty 是什么</strong>
>
> DotNetty 是微软的 Azure 团队仿造 Netty 编写的网络应用程序框架。
>
> <strong>优点</strong>
>
> 1. 关注点分离——业务和网络逻辑解耦；
> 2. 模块化和可复用性；
> 3. 可测试性作为首要的要求
>
> ————————————————<br/>
> 版权声明：本文为 CSDN 博主「聂 14 昊 51」的原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接及本声明。<br/>
> 原文链接：[https://blog.csdn.net/nxy_wuhao/article/details/102794214](https://blog.csdn.net/nxy_wuhao/article/details/102794214)

总之来说，DotNetty 的理念和使用方法同 Java 的 Netty 是一致的。所以在使用 DotNetty 的过程中遇到问题完全可以在 Netty 社区中找到答案。

## 使用

在 Github 中我们已经开源了 NrcTcpLibrary 的代码，所以这里主要是对代码的简单解读。

在 DotNetty 中，每一个连接是一个 Channel，我们仅需关注 Channel 中的数据流入与流出，至于保持长连接等事情则不需要我们关注。

### ClientBase.cs

首先是建立连接，在 DotNetty 中，所有的 Channel 都由一个 group 进行管理，由于 NexDroid 控制器的 6000 端口仅接受一个客户端连接，所以这个 group 中只有一个 Channel。

每一个 Channel 的数据流入和流出都是经由管道(pipeline)的，在 pipeline 中可以对流入和流出的数据进行加工，例如心跳机制和数据的解析都是在这里完成的。

```csharp
private MessageHandler messageHandler = null;
private ManualResetEvent closingArrivedEvent = new ManualResetEvent(false);
public IChannel clientChannel = null;

public async Task RunClientAsync(string ip, int port)
{
    // 建立一个group
    var group = new MultithreadEventLoopGroup();
    try
    {
        //每一个Channel的设置都是由BootStrap完成的。
        Bootstrap bootstrap = new Bootstrap();
        //指定Group为group，并设置Channel的类型为TcpSocket
        bootstrap.Group(group).Channel<TcpSocketChannel>()
            .Option(ChannelOption.TcpNodelay, true)
            //3秒的Timeout
            .Option(ChannelOption.ConnectTimeout, TimeSpan.FromSeconds(3))
            .Handler(new ActionChannelInitializer<ISocketChannel>(channel =>
            {
                //这里的Handler是对流入数据的加工。
                IChannelPipeline pipeline = channel.Pipeline;
                //心跳机制，2秒一次心跳
                pipeline.AddLast("idleStateHandle", new IdleStateHandler(2, 2, 0));
                //流入数据解析
                pipeline.AddLast("client", new ClientHandler(this.messageHandler));
            }));
            //连接到指定ip和port
        clientChannel = await bootstrap.ConnectAsync(new IPEndPoint(IPAddress.Parse(ip), port));
        //关闭连接
        closingArrivedEvent.Reset();
        closingArrivedEvent.WaitOne();
        await clientChannel.CloseAsync();
    }
    finally
    {
        //关闭后执行
        await group.ShutdownGracefullyAsync(TimeSpan.FromMilliseconds(100), TimeSpan.FromSeconds(1));
    }
}
```

下面是发送数据的封装，发送数据的 data 段我们可能是发送 string 类型，也可能是 byte[]，所以我们增加一个重载函数来发送两种类型。

```csharp
public static IByteBuffer EncodeMessage(int command, byte[] data)
{
    //帧头段
    byte[] headerByte = new byte[] { 0x4e, 0x66 };
    //将命令字转为两个字节
    int command_pre = command / 256;
    int command_aft = command % 256;
    //命令字段
    byte[] commandByte = new byte[] { (byte)command_pre, (byte)command_aft };
    UTF8Encoding utf8 = new UTF8Encoding();
    //data段
    byte[] dataByte = data;
    int dataLength = dataByte.Length;
    int dataLengthByte_pre = dataLength / 256;
    int dataLengthByte_aft = dataLength % 256;
    //数据长度段
    byte[] dataLengthByte = new byte[] { (byte)dataLengthByte_pre, (byte)dataLengthByte_aft };
    //要发送的数据
    byte[] msgByte = new byte[10 + dataLength];
    //将所有数据段放入msgByte
    headerByte.CopyTo(msgByte, 0);
    dataLengthByte.CopyTo(msgByte, 2);
    commandByte.CopyTo(msgByte, 4);
    dataByte.CopyTo(msgByte, 6);
    //组成要crc32校验的数据段
    byte[] msgToCrc32 = msgByte.Skip(2).Take(msgByte.Length - 6).ToArray();
    //crc32校验
    uint crc32Num = Crc32.CRC(msgToCrc32);
    byte[] _crc32Byte = BitConverter.GetBytes(crc32Num);
    byte[] crc32Byte = new byte[4];
    for (int i = 0; i < 4; i++)
    {
        crc32Byte[i] = _crc32Byte[3 - i];
    }
    //将crc32校验的数据段放入
    crc32Byte.CopyTo(msgByte, 6 + dataLength);
    //转为ByteBuffer
    IByteBuffer messageBuffer = Unpooled.Buffer(msgByte.Length);
    messageBuffer.WriteBytes(msgByte);
    return messageBuffer;
}

public static IByteBuffer EncodeMessage(int command, string data)
{
    byte[] headerByte = new byte[] { 0x4e, 0x66 };
    int command_pre = command / 256;
    int command_aft = command % 256;
    byte[] commandByte = new byte[] { (byte)command_pre, (byte)command_aft };
    UTF8Encoding utf8 = new UTF8Encoding();
    byte[] dataByte = utf8.GetBytes(data);
    int dataLength = dataByte.Length;
    int dataLengthByte_pre = dataLength / 256;
    int dataLengthByte_aft = dataLength % 256;
    byte[] dataLengthByte = new byte[] { (byte)dataLengthByte_pre, (byte)dataLengthByte_aft };
    byte[] msgByte = new byte[10 + dataLength];
    headerByte.CopyTo(msgByte, 0);
    dataLengthByte.CopyTo(msgByte, 2);
    commandByte.CopyTo(msgByte, 4);
    dataByte.CopyTo(msgByte, 6);
    byte[] msgToCrc32 = msgByte.Skip(2).Take(msgByte.Length - 6).ToArray();
    uint crc32Num = Crc32.CRC(msgToCrc32);
    byte[] _crc32Byte = BitConverter.GetBytes(crc32Num);
    byte[] crc32Byte = new byte[4];
    for (int i = 0; i < 4; i++)
    {
        crc32Byte[i] = _crc32Byte[3 - i];
    }
    crc32Byte.CopyTo(msgByte, 6 + dataLength);

    IByteBuffer messageBuffer = Unpooled.Buffer(msgByte.Length);
    messageBuffer.WriteBytes(msgByte);
    return messageBuffer;
}
```

我们希望发送是多线程的，不会使界面卡顿。利用 C#的 Task，可以更方便地实现。

```csharp
//发送数据的Task，组装数据后送出
private async Task SendMessageTask(int command, byte[] data)
{
    if (clientChannel == null || !clientChannel.Active || !clientChannel.IsWritable)
    {
        return;
    }
    IByteBuffer buffer = EncodeMessage(command, data);
    await clientChannel.WriteAndFlushAsync(buffer);
}

private async Task SendMessageTask(int command, string data)
{
    if (clientChannel == null || !clientChannel.Active || !clientChannel.IsWritable)
    {
        System.Diagnostics.Debug.WriteLine("Error");
        System.Diagnostics.Debug.WriteLine(clientChannel);
        return;
    }
    IByteBuffer buffer = EncodeMessage(command, data);
    System.Diagnostics.Debug.WriteLine("Error");
    await clientChannel.WriteAndFlushAsync(buffer);
}
//执行Task
public void SendMessage(int command, string data)
{
    Task.Run(() => SendMessageTask(command, data));
}

public void SendMessage(int command, byte[] data)
{
    Task.Run(() => SendMessageTask(command, data));
}
```

### Crc32.cs

对数据进行 Crc32 校验使用。

### Message.cs

解析数据时将命令字和数据段解析到这里的 Message 实体类。

### ClientHandler.cs

这里是 Channel 的 Handler，包括流入数据的解析和异常处理等。

由于流入数据可能会存在黏包的问题，所以我们将流入的数据存入一个 List 中，然后再根据数据的帧头、数据段长度对数据段进行解析，一直到 List 中的数据处理完成为止。

```csharp
private List<byte> recivedBytes = new List<byte>();
private MessageHandler messageHandler = null;
//构造函数，将传入的MessageHandler传入messageHandler中，方便第三方用户使用。
public ClientHandler(MessageHandler msh)
{
    this.messageHandler = msh;
}
//数据读取事件，由DotNetty提供，这里将数据都扔到recivedBytes中等待处理
public override void ChannelRead(IChannelHandlerContext context, object message)
{
    var byteBuffer = message as IByteBuffer;
    if (byteBuffer != null)
    {
        byte[] byteArray = new byte[byteBuffer.ReadableBytes];
        byteBuffer.GetBytes(byteBuffer.ReaderIndex, byteArray);
        recivedBytes.AddRange(byteArray);
    }
}
//数据读取完成事件，由DotNetty提供，数据读取完成后开始处理
public override void ChannelReadComplete(IChannelHandlerContext context)
{
    Handle();
}
private void Handle()
{
    //由于每一个数据需要至少10个字节，所以如果小于10个字节则不处理，等待下一个数据传过来再处理
    if (recivedBytes.Count < 10) { return; }
    //找帧头
    int fIndex = recivedBytes.FindIndex(v => v == 0x4E);
    if (fIndex == -1) { recivedBytes.Clear(); return; }
    if (recivedBytes[fIndex + 1] != 0x66) { return; }
    //找到data端长度
    int dataLength = recivedBytes[fIndex + 2] * 256 + recivedBytes[fIndex + 3];
    //如果总长度小于带data端的长度，则说明数据段不全，等待下一次执行
    if (recivedBytes.Count < 10 + dataLength) { return; }
    //拿到命令字
    int commandInt = recivedBytes[fIndex + 4] * 256 + recivedBytes[fIndex + 5];
    //拿到data
    byte[] dataBytes = new byte[dataLength];
    recivedBytes.CopyTo(fIndex + 6, dataBytes, 0, dataLength);
    //实例化Message类用来传输命令字和data
    Message message = new Message();
    //将data段转为string
    message.data = Encoding.UTF8.GetString(dataBytes);
    message.command = commandInt;
    //将Message传给第三方用户传入的messageHandler
    this.messageHandler.Handler(message);
    //处理完成数据后将已处理的数据移除
    recivedBytes.RemoveRange(0, fIndex + 10 + dataLength);
    Handle();
}
```

除了要处理流入的数据，还需要对 Channel 的状态进行维护，连接的开启和关闭需要通知用户，并需要有心跳机制和异常处理机制。

```csharp
//连接成功的事件，DotNetty提供
 public override void ChannelActive(IChannelHandlerContext context)
{
    base.ChannelActive(context);
    this.messageHandler.ConnectState(true);
}
//连接断开的事件，DotNetty提供
public override void ChannelInactive(IChannelHandlerContext context)
{
    base.ChannelInactive(context);
    this.messageHandler.ConnectState(false);
}
//其它事件，这里用来写心跳机制
public override void UserEventTriggered(IChannelHandlerContext context, object evt)
{
    base.UserEventTriggered(context, evt);
    if (evt is IdleStateEvent)
    {
        var e = evt as IdleStateEvent;
        switch (e.State)
        {
            //流入数据的心跳，这里用来做断线超时重连，但是我们希望用户自行重连，所以没有做处理
            case IdleState.ReaderIdle:
                {
                    if (!context.Channel.Active)
                    {
                        return;
                    }
                }
                break;
            //流出数据的心跳，每2s发送一次心跳信息
            case IdleState.WriterIdle:
                {
                    TimeSpan ts = DateTime.Now - new DateTime(1970, 1, 1, 0, 0, 0, 0);
                    string tsString = Convert.ToInt64(ts.TotalMilliseconds).ToString();
                    string jsonString = "{\"time\":" + tsString + "}";
                    IByteBuffer buffer = ClientBase.EncodeMessage(0x7266, jsonString);
                    context.WriteAndFlushAsync(buffer);
                }
                break;

            default:
                break;
        }
    }
}
//连接异常的处理
public override void ExceptionCaught(IChannelHandlerContext context, Exception exception)
{
    Console.WriteLine("Exception: " + exception);
    this.messageHandler.ConnectState(false);
    context.CloseAsync();
}
```

### MessageHandler.cs

流入数据处理方法，用户需要覆写其中的 Handler 和 ConnectState 方法。
