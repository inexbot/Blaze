---
sidebar_position: 6
---

# WebSocket

所有 H5 程序和控制器进行通讯，都只能通过一个中转程序用 WebSocket 来和控制器进行通讯。对于 JavaScript 来说，他们的通讯方式都是一样的。

对于不同的框架来说，接收数据处理是不同的地方。对于 React 来说需要用到 Redux，对于 Vue 来说需要用的 Vuex，他们都是状态管理库，可以看作为一个运行在程序顶层的数据流。

当程序接收到控制器的数据后，需要将数据根据命令字来区分处理，将状态、参数储存在数据流中，当页面需要数据的时候只需在数据流中取用即可。

## 数据中转

针对数据中转，我们准备了两套解决方案，分别是基于 Qt 的完整数据中转和基于 Go 的精简程序。

当前仅在这里提供 Qt 版本的下载，Go 精简版在完善后会放出。

[Qt 完整版中转程序](https://inexbot-use.oss-cn-shanghai.aliyuncs.com/WebSocket/TBServer.zip)

他们的区分如下

|     参数     |                   Qt 完整版                    |    Go 精简版    |
| :----------: | :--------------------------------------------: | :-------------: |
|   数据转发   |                       ✔️                       |       ✔️        |
|   版本控制   |   ✔️ 如果转发程序版本和控制器不同，无法使用    |  ❌ 无版本限制  |
| 程序文件解析 | ✔️ 中转程序可以解析 JBR 程序并给出指令信息对象 | ❌ 需要自己解析 |
|   使用难度   |                    😔 复杂                     |     😃 简单     |

### Qt 中转版程序

需要放在控制器中，并将 TBServer 和 TBServer.sh 两个文件运行权限修改为可执行。

使用<strong>inexbot</strong>用户运行 TBServer.sh 文件。

## JavaScript 发送数据组装

利用中转程序，data 段不需要进行 crc32 校验

```javascript
function AssemblyData(command, data) {
  let message = [];
  let dataLength;
  dataLength = data !== "" ? JSON.stringify(data).length : 0;
  message.push(0x4e);
  message.push(0x66);
  message.push(dataLength);
  message.push(command);
  if (data !== "") {
    message.push(JSON.stringify(data));
  }
  return message;
}
```

## JavaScript 接收数据解析

```javascript
function comeMessage(message) {
  var newArray = message.data.split(",");
  //来自控制器的数据
  if (newArray[0] === "78" && newArray[1] === "102") {
    let dataLength = newArray[2];
    let command = newArray[3];
    let dataArray = [];
    for (let i = 4; i < newArray.length; i++) {
      dataArray[i - 4] = newArray[i];
    }
    let dataString = dataArray.join(",");
    let newDataLength = getLength(dataString).toString();
    if (newDataLength === dataLength) {
      let co = parseFloat(command).toString(16);
      let data = dataString;
      let all = [co, data];
      return all;
    } else {
      //do something to error message
    }
  }
  //来自server自己的数据（包括作业文件等）
  else if (newArray[0] === "78" && newArray[1] === "103") {
    let dataLength = newArray[2];
    let command = newArray[3];
    let dataArray = [];
    for (let i = 4; i < newArray.length; i++) {
      dataArray[i - 4] = newArray[i];
    }
    let dataString = dataArray.join(",");
    let newDataLength = getLength(dataString).toString();
    if (newDataLength === dataLength) {
      let co = parseFloat(command).toString(16);
      let data = dataString;
      let all = [co, data];
      return all;
    } else {
      //do something to error message
    }
  }
}
```

## React 的接收数据流

在 React 框架中，用来接收 WebSocket 数据最有效的办法就是 [Redux](https://www.redux.org.cn/) 。当然从头学习 Redux 是个苦恼的事情，所以我们更加推荐[DvaJS](https://dvajs.com/)。

> dva 首先是一个基于 redux 和 redux-saga 的数据流方案，然后为了简化开发体验，dva 还额外内置了 react-router 和 fetch，所以也可以理解为一个轻量级的应用框架。
>
> ——来自 DvaJs 官网介绍

DvaJs 的用法和 Redux 其实是相同的，只不过它更简单易用，学习成本更低一些。

使用 DvaJs 的订阅(subscriptions)功能可以完美的解决 WebSocket 数据接收的问题。下面是一个使用 subscriptions 来接收、解析数据，并按照 command 命令字来分别进行处理的示例。

接收到机器人总数的数据，其命令字为 0x2E06。

```javascript
//src/Model/index.js
export default {
  namespace: "index",
  state: {
    //机器人总数
    robotSum: 1,
  },
  subscriptions: {
    WebSocket({ dispatch }) {
      //ws是WebSocket的实例
      ws.onmessage = (message) => {
        var data = ParseMessage(message);
        var command = data[0];
        var dataString = data[1];
        var dataObject;
        if (dataString == "") {
          dataObject = "";
        } else {
          dataObject = JSON.parse(dataString);
        }
        switch (command) {
          case "2e06":
            dispatch({
              type: "handleRobotSum",
              data: dataObject,
            });
            break;
          default:
            break;
        }
      };
    },
  },
  reducers: {
    handleRobotSum(state, action) {
      let _state = JSON.parse(JSON.stringify(state));
      _state.robotSum = action.data.sum;
      return _state;
    },
  },
};
```

在组件中使用

```javascript
import react, { useEffect } from "react";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return {
    robotSum: state.robotSum,
  };
};

function Index(props) {
  useEffect(() => {
    //do something when robotSum changed
  }, [props.robotSum]);
}

export default connect(mapStateToProps)(Index);
```

更多的使用请学习 [DvaJs 官方文档](https://dvajs.com/guide/concepts.html)

## Vue 的接收数据流

在 Vue 框架中，和 React 使用 Redux 或 DvaJs 相同，需要使用到 [Vuex](https://vuex.vuejs.org/zh/)，它的设计细想和 Redux 是相同的，都是状态管理。

> Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。
>
> ——来自 Vuex 官网介绍

其解决思路和 DvaJs 很像，搜索“Vuex WebSocket”会得到很多答案，这里不做赘述。
