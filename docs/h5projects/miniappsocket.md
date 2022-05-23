---
sidebar_position: 7
---

# 小程序直连机器人控制器

由于微信在小程序库版本 2.18 后开放了 TcpSocket 接口，所以我们可以使用小程序直接与控制器进行 Tcp 通讯了。

## 引用库

- [typescript](https://www.tslang.cn/) - TypeScript 教程 TypeScript 是 JavaScript 的一个超集;
- [utf-8](https://github.com/nfroidure/utf-8) - 将 utf8 字符串转换为 Buffer;
- [buffer](https://github.com/feross/buffer) - 在前端调用 NodeJs 中的 Buffer Api;
- [crc32](https://github.com/beatgammit/crc32) - 很好用的 Crc32 校验工具
- [Taro](https://taro-docs.jd.com/) - 京东的跨端开发库，在 Tcp 的封装中使用该库调用微信的 Tcp 接口欧

## 封装 NexDriod Tcp 库

### 消息类型

定义消息接收的类型，包含命令字 command 和 JSON 数据 data。

```typescript
export interface Message {
  command: number;
  data: Object;
}
```

### 创建连接

根据小程序的[`wx.createTCPSocket`](https://developers.weixin.qq.com/miniprogram/dev/api/network/tcp/wx.createTCPSocket.html)，在 Taro 中调用则需要用`Taro.createTCPSocket`

```typescript
import Taro, { TCPSocket } from "@tarojs/taro";
export default class Tcp {
  private Tcp: TcpSocket = Taro.createTCPSocket();
  private connected: boolean;
  // 单例模式
  static instance: Tcp;
  static getInstance(): Tcp {
    if (!this.instance) {
      this.instance = new Tcp();
    }
    return this.instance;
  }
  // 连接
  public connect(ip: string, port: number): void {
    this.Tcp.connect({ address: ip, port: port });
  }
}
```

### 监听状态

我们需要监听 Tcp 的连接、断开、出错等状态，根据[`TcpSocket`](https://developers.weixin.qq.com/miniprogram/dev/api/network/tcp/TCPSocket.html)实例的文档，我们在构造函数中开始监听，否则会出现多次创建监听的错误。

```typescript
private constructor() {
    // 连接上的回调
    this.Tcp.onConnect(() => {
      this.connected = true;
    });
    // 关闭的回调
    this.Tcp.onClose(() => {
      this.connected = false;
    });
    // 出错的回调
    this.Tcp.onError((result: TCPSocket.onError.CallbackResult) => {
      this.Tcp.close();
    });
    // 收到消息的回调
    this.Tcp.onMessage((result: TCPSocket.onMessage.CallbackResult) => {
      do something ...
    });
    // 停止监听关闭状态的回调
    this.Tcp.offClose(() => {
      console.log("OffClose");
    });
    // 停止监听连接状态的回调
    this.Tcp.offConnect(() => {
      console.log("OffConnect");
    });
    // 停止监听报错状态的回调
    this.Tcp.offError(() => {
      console.log("OffError");
    });
    // 停止监听消息状态的回调
    this.Tcp.offMessage(() => {
      console.log("OffMessage");
    });
  }
```

### 设置外部的回调函数

虽然在 Tcp 类里面我们设置好了小程序 API 中各个状态监听的回调函数，但是我们在类外面也需要设置各个状态的回调函数。

```typescript
private onMessageCallback: Function;
private onConnectedCallback: Function;
private onCloseCallback: Function;
private onErrorCallback: Function;

public setCallback(
    onMessageCallback: Function,
    onConnectedCallback?,
    onCloseCallback?,
    onErrorCallback?
  ): void {
    this.onMessageCallback = onMessageCallback;
    if (onConnectedCallback) {
      this.onConnectedCallback = onConnectedCallback;
    }
    if (onCloseCallback) {
      this.onCloseCallback = onCloseCallback;
    }
    if (onErrorCallback) {
      this.onErrorCallback = onErrorCallback;
    }
  }
```

然后修改一下构造函数。

```typescript
private constructor() {
  this.Tcp.onConnect(() => {
    if (this.onConnectedCallback) {
      this.onConnectedCallback();
    }
    this.connected = true;
  });
  this.Tcp.onClose(() => {
    this.connected = false;
    this.onCloseCallback();
  });
  this.Tcp.onError((result: TCPSocket.onError.CallbackResult) => {
    if (this.onErrorCallback) {
      this.onErrorCallback(result);
    }
    this.Tcp.close();
  });
  this.Tcp.onMessage((result: TCPSocket.onMessage.CallbackResult) => {
    this.receiveBuffer(result.message);
  });
  this.Tcp.offClose(() => {
    console.log("OffClose");
  });
  this.Tcp.offConnect(() => {
    console.log("OffConnect");
  });
  this.Tcp.offError(() => {
    console.log("OffError");
  });
  this.Tcp.offMessage(() => {
    console.log("OffMessage");
  });
}
```

说实在的，那几个 offXXX 回调到底啥时候被调用咱也没搞明白，没见被调用过。

### 发消息

根据小程序的 API，我们发送消息需要使用[`TCPSocket.write`](https://developers.weixin.qq.com/miniprogram/dev/api/network/tcp/TCPSocket.write.html)接口.

但是我们将命令字、数据发送给控制器的时候是需要先编码为 Buffer 的，所以先定义编码函数。

```typescript
import crc32 from "crc32";
// 这个buffer不是NodeJS自带的buffer库，而是引用的第三方提供给浏览器使用的buffer api
import Bf from "buffer/index";
const Buffer = Bf.Buffer;

private encodeMessage(command: number, msg: Object): Bf.Buffer | null {
  try {
    const dataString = JSON.stringify(msg);
    const dataBuffer = Buffer.from(
      new Uint8Array(utf8.setBytesFromString(dataString))
    );
    const dataLength = msg ? dataBuffer.byteLength : 0;
    const headBuffer = Buffer.from([0x4e, 0x66]);
    let lengthBuffer = Buffer.alloc(2);
    lengthBuffer.writeIntBE(dataLength, 0, 2);
    let commandBuffer = Buffer.alloc(2);
    commandBuffer.writeUIntBE(command, 0, 2);
    const toCrc32 = Buffer.concat([lengthBuffer, commandBuffer, dataBuffer]);
    const crc32Buffer: Buffer = crc32(toCrc32);
    const message = Buffer.concat([
      headBuffer,
      lengthBuffer,
      commandBuffer,
      dataBuffer,
      crc32Buffer,
    ]);
    return message;
  } catch (err) {
    console.error(err);
    return null;
  }
}
```

然后我们就可以拿到编码好的数据，直接发送即可

```typescript
public sendMessage(command, msg: Object) {
  if (!this.connected) {
    return { result: false, errMsg: "noConnect" };
  } else {
    const message = this.encodeMessage(command, msg);
    if (message) {
      this.Tcp.write(message);
    }
  }
  return { result: true, errMsg: "" };
}
```

### 心跳机制

所有的通讯机制都需要心跳来验证连接可用性。

现在需要考虑一下什么时候要发心跳，什么时候要暂停发心跳。

1. 连接后开始发;
2. 断开连接停止发;
3. 发送消息时先暂停发，等发送消息后 1 秒还没有发新的消息，则继续发心跳。

定义发心跳、停止发心跳、重新开始发心跳的方法

```typescript
private heartBeatInterval: NodeJS.Timer | null;
private resetHeartBeatTimer: NodeJS.Timeout | null;
// 每1秒发一次
private heartBeat(): void {
  this.heartBeatInterval = setInterval(() => {
    this.sendMessage(0x7266, { time: new Date().getTime() });
  }, 1000);
}
//停止发送
private stopHeartBeat(): void {
  if (this.heartBeatInterval) {
    clearInterval(this.heartBeatInterval);
    this.heartBeatInterval = null;
  }
}
//重新开始发
private resetHeartBeat(): void {
  if (this.heartBeatInterval) {
    this.stopHeartBeat();
  }
  if (this.resetHeartBeatTimer) {
    clearTimeout(this.resetHeartBeatTimer);
    this.resetHeartBeatTimer = null;
  }
  this.resetHeartBeatTimer = setTimeout(() => {
    this.heartBeat();
    this.resetHeartBeatTimer = null;
  }, 1000);
}
```

然后改造一下连接后、断开连接、发送消息的方法

```typescript
private constructor(){
  this.Tcp.onConnect(() => {
  if (this.onConnectedCallback) {
      this.onConnectedCallback();
  }
  this.connected = true;
  this.heartBeat();
  });
  this.Tcp.onClose(() => {
  this.stopHeartBeat();
  this.connected = false;
  this.onCloseCallback();
  });
}
public sendMessage(command, msg: Object) {
  this.stopHeartBeat();
  if (!this.connected) {
    return { result: false, errMsg: "noConnect" };
  } else {
    const message = this.encodeMessage(command, msg);
    if (message) {
      this.Tcp.write(message);
    }
  }
  this.resetHeartBeat();
  return { result: true, errMsg: "" };
}
```

### 接收消息

现在发送消息的事情已经做完啦！

下面开始搞接收消息。

首先从控制器发过来的消息也都是 Buffer，而且可能会有黏包问题，所以为了解决这个问题，我们定义一个 Buffer 池，发来的消息先全部扔到池子里，然后再从池子里拿出一条一条消息来处理。

```typescript
private bufferPool: Bf.Buffer = Buffer.alloc(0);

private constructor(){
  this.Tcp.onMessage((result: TCPSocket.onMessage.CallbackResult) => {
    this.receiveBuffer(result.message);
  });
}

private receiveBuffer(buffer: ArrayBuffer): void {
  const newBuffer = Buffer.from(buffer);
  //把消息扔到池子里
  this.bufferPool = Buffer.concat([this.bufferPool, newBuffer]);
  //处理消息
  this.handleBuffer();
}
private handleBuffer(): void {
    //处理池子里的消息
}
```

那么下面需要把池子里的消息拿出来一条，在池子里删了这一条然后处理这一条，如果处理完了池子里还有剩下的那就继续重复上面的步骤。

```typescript
private handleBuffer(): void {
    //找到头
  const index = this.bufferPool.indexOf("Nf");
  if (index < 0) {
    return;
  }
  //找到定义长度的地方
  const lengthBuffer = this.bufferPool.slice(index + 2, index + 4);
  const length = lengthBuffer.readUIntBE(0, 2);
  //裁剪出需要的数据
  const buffer = this.bufferPool.slice(index, index + 2 + 2 + 2 + length + 4);
  if (buffer.length < index + 2 + 2 + 2 + length + 4) {
    return;
  }
  this.bufferPool = this.bufferPool.slice(index + 2 + 2 + 2 + length + 4);
  const decodedMessage: Message = this.decodeMessage(buffer);
  this.handleMessage(decodedMessage);
  //重复上面的工作
  this.handleBuffer();
}

private decodedMessage(message: Message){
    //解码消息
}

//处理解码完的消息，也就是把消息传递给前面定义的回调函数
private handleMessage(message: Message): void {
  this.onMessageCallback(message);
}

```

### 解码消息

拿到数据 Buffer 后需要解码才能拿到我们需要的命令字和 JSON 数据。

这个过程其实也就是编码的逆过程。

```typescript
private decodeMessage(buffer: Bf.Buffer): Message {
  const commandBuffer = buffer.slice(4, 6);
  const dataBuffer = buffer.slice(6, buffer.length - 4);
  const command = commandBuffer.readUIntBE(0, 2);
  const dataStr = dataBuffer.toString();
  const data = dataStr ? JSON.parse(dataStr) : {};
  const message: Message = {
    command: command,
    data: data,
  };
  return message;
}
```

### 用例

现在我们已经定义好这个小程序中连接控制器并发送、接收数据的类了。那么该使用它了。

```typescript
import Tcp,{ Message } from "xxxx";
import { TCPSocket } form "@tarojs/taro";

const tcp = Tcp.getInstance();

function onConnected(){
    console.log("yes!");
}

function onClose(){
    console.log("no!");
}

function onError(result: TCPSocket.onError.CallbackResult){
    console.log(result.errMsg);
}

function onMessage(message: Message){
    console.log(message.command,message.data);
}

tcp.setCallback(onMessage, onConnected, onClose, onError);

tcp.connect("192.168.1.13",6001);

tcp.sendMessage(0x2002,{"robot":1});

```

### 在 React 或者 Vue 中怎么用？

可以参考[React 的接收数据流](https://blaze.inexbot.com/docs/h5projects/websocket#react-%E7%9A%84%E6%8E%A5%E6%94%B6%E6%95%B0%E6%8D%AE%E6%B5%81)
