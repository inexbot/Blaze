---
sidebar_position: 5
---

# H5 桌面端软件

由于浏览器的限制，H5 页面不能够使用 Tcp/Socket 协议来和控制器进行通讯，能够使用的通讯协议只有 websocket，如果与控制器进行通讯则需要第三方程序进行转发，很麻烦，而且通讯效率很低。

于是我们想到将 H5 页面打包成一个桌面端的软件，这样就跳出了浏览器的限制，使用原生的 Tcp/Socket 进行通讯。

## NexDroid 桌面调试软件

我们正在尝试开发一个简易的机器人参数调试软件，用来验证上面想法的可行性。

[试用下载](https://inexbot-use.oss-cn-shanghai.aliyuncs.com/pc-debugger/version/NexDroid%E6%A1%8C%E9%9D%A2%E8%B0%83%E8%AF%95%20Setup%200.1.3.exe)

<img src="/img/h5projects/pcdebugger1.png" align="center" />

### 技术栈

- [React - 用于构建用户界面的 JavaScript 库](https://react.docschina.org/)
- [UmiJs - 🍙 插件化的企业级前端应用框架。](https://umijs.org/zh-CN)
- [Electron - 使用 JavaScript，HTML 和 CSS 构建跨平台的桌面应用程序](https://www.electronjs.org/)
- [DvaJs - dva 是一个基于 redux 和 redux-saga 的数据流方案](https://dvajs.com/)
- [Ant Design - 企业级产品设计体系，创造高效愉悦的工作体验](https://ant.design/index-cn)
- [Ant Design Charts - 简单好用的 React 图表库](https://charts.ant.design/zh-CN)

### 实现原理

使用 Electron 将网页程序打包成可执行程序。当运行的时候会有两个进程，主进程与渲染进程。

所谓的渲染进程，就是页面显示的进程，也可以理解为一个浏览器客户端的进程。主进程可以理解为一个服务端或者后端进程。

当页面需要与机器人控制器进行通讯时，其流程如下：

`渲染进程->进程间通讯->主进程->Tcp->机器人控制器`

以上通讯原理在 Electron 的`ipcMain`、`ipcRenderer`等模块中可以找到。

### 通讯协议

鉴于若要组成 NexDroid 控制系统数据段比较复杂，下面公开 javascript 语言中组成和解析数据段的函数。

#### 组装数据段

该方法需要引用两个第三方库，[crc32](https://www.npmjs.com/package/crc32)、[utf-8](https://www.npmjs.com/package/utf-8)

`npm install crc32 utf-8`

```javascript
var crc32 = require("crc32");
var utf8 = require("utf-8");
```

发送对象数据

```javascript
//发送数据，command为命令字，格式为int，如0xFF12，data为对象，如{"robot":1}
function AssemblyData(command, data) {
  var dataLength;
  var dataString = JSON.stringify(data);
  var dataBuffer = new Uint8Array(utf8.setBytesFromString(dataString));
  dataLength = data ? dataBuffer.byteLength : 0;
  var headerBuffer = Buffer.from([0x4e, 0x66]);
  var lengthBuffer = Buffer.alloc(2);
  lengthBuffer.writeIntBE(dataLength, 0, 2);
  var commandBuffer = Buffer.alloc(2);
  commandBuffer.writeUIntBE(command, 0, 2);
  var toCrc32 = Buffer.concat([lengthBuffer, commandBuffer, dataBuffer]);
  var crc32Buffer = crc32(toCrc32);
  var message = Buffer.concat([
    headerBuffer,
    lengthBuffer,
    commandBuffer,
    dataBuffer,
    crc32Buffer,
  ]);
  return message;
}
```

发送文件 Buffer 数据

```javascript
//data类型为buffer
function AssemblyData(command, data) {
  var dataLength;
  var dataBuffer = data;
  dataLength = dataBuffer.byteLength;
  var headerBuffer = Buffer.from([0x4e, 0x66]);
  var lengthBuffer = Buffer.alloc(2);
  lengthBuffer.writeIntBE(dataLength, 0, 2);
  var commandBuffer = Buffer.alloc(2);
  commandBuffer.writeUIntBE(command, 0, 2);
  var toCrc32 = Buffer.concat([lengthBuffer, commandBuffer, dataBuffer]);
  var crc32Buffer = crc32(toCrc32);
  var message = Buffer.concat([
    headerBuffer,
    lengthBuffer,
    commandBuffer,
    dataBuffer,
    crc32Buffer,
  ]);
  return message;
}
```

#### 解析数据

Tcp 接收数据会偶有黏包问题，若要解决这个问题，需要将所有接收数据放在一个大的 Buffer 中，再一个个解析。

```javascript
var bigBuffer = Buffer.alloc(0);
//接收事件
socket.on("data",(buffer)=>{
    receiveBuffer(buffer);
})
//将新接收数据放在bigBuffer中，然后开始处理
function receiveBuffer(buffer) {
  bigBuffer = Buffer.concat([bigBuffer, buffer]);
  handleReviceBuffer(bigBuffer)
}
//处理大Buffer
function handleReviceBuffer(buffer) {
  var index = buffer.indexOf('Nf');
  if (index == -1) {
    return;
  }
  var lengthBuffer = buffer.slice(index + 2, index + 4);
  var length = lengthBuffer.readUIntBE(0, 2);
  var newBuffer = buffer.slice(index, index + 2 + 2 + 2 + length + 4);
  if (newBuffer.length < index + 2 + 2 + 2 + length + 4) {
    return;
  }
  bigBuffer = buffer.slice(index + 2 + 2 + 2 + length + 4);
  handleBuffer(newBuffer);
  handleReviceBuffer(bigBuffer);
}
//解析数据
function handleBuffer(buffer) {
  var commandBuffer = buffer.slice(4, 6);
  var dataBuffer = buffer.slice(6, buffer.length - 4);
  var commandInt = commandBuffer.readUIntBE(0, 2);
  //0x5521是接收文件Buffer数据的命令字
  if (commandInt == 0x5521) {
    handleReceiveMessage(commandInt, dataBuffer);
    return;
  }
  //0x5522是接收文件的判断成功命令字
  if (commandInt == 0x5522) {
    handleReceiveMessage(commandInt, '');
    return;
  }
  var dataString = dataBuffer.toString();
  var dataJSON = JSON.parse(dataString);
  handleReceiveMessage(commandInt, dataJSON);
}
handleReceiveMessage(command,data){
  //do sth to command and data
}
```

### 示波器

我们尝试做了一个示波器功能。本来我们想要实时显示当前数据波形，但是发现由于性能原因，卡顿严重。于是我们采取了先采集数据，然后根据需求显示的形式，完全可以实现采样周期 10ms，采样点数 2000 个的标准。

当前可以同时采集关节轴坐标值、轴速度、轴加速度、电机力矩、电机电流等参数，再根据需要选择并绘制，不需要不同参数重复采集。

数据采集使用的 NexDroid 系统提供的 7000 端口。图表绘制出于方便采用了[Ant Design Charts](https://charts.ant.design/)

<img src="/img/h5projects/pcdebugger2.png" align="center" />

### 代码编辑

PC 版调试软件集成了一个简易的代码编辑器功能，可以解析<strong>lua</strong>脚本文件和 NexDroid 系统的程序文件<strong>JBR</strong>格式。

该代码编辑器使用了微软公司的[Monaco Editor](https://microsoft.github.io/monaco-editor/)

<img src="/img/h5projects/pcdebugger3.png" align="center" />
