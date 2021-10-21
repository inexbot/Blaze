---
sidebar_position: 2
---

# go 程序

由于对 python 执行效率的怀疑以及 python 版本的并不支持飞行摇杆设备，所以我们用 go 语言重新写了一个同时支持飞行摇杆和游戏手柄的程序。

请扫码关注“纳博特科技 Inexbot”视频号，查看手柄、飞行摇杆操作机器人视频。

<img src="/img/videoqrcode.jpg" width="350" />

本程序提供[PC 版](https://inexbot-use.oss-cn-shanghai.aliyuncs.com/joystick/gostickwin32.zip)和[控制器版](https://inexbot-use.oss-cn-shanghai.aliyuncs.com/joystick/gosticklinux32.zip)两个版本。

## 使用

### 前提

如果使用控制器版，请联系纳博特科技，确定您的控制器支持本版本手柄/摇杆程序。

### PC 版

1. 电脑和控制器保持在同一网段，连接同一个路由器或交换机。确定电脑能够 ping 通控制器的 ip 地址
2. 将手柄或飞行摇杆连接到电脑
3. 解压缩 gostickwin32.zip，运行其中的 gostick.exe 程序
4. 看到提示后输入控制器的 ip 地址，如"192.168.1.13"
5. 现在可以用手柄或者摇杆控制机器人了！

### 控制器版

1. 解压缩 gosticklinux32.zip，将其中的 gostick 文件放到控制器的`/home/inexbot/gostick/`目录下
2. 设置文件的权限`sudo chmod 777 /home/inexbot/gostick/gostick`
3. 将手柄或飞行摇杆连接到控制器
4. 运行 gotick `sudo /home/inexbot/gostick/gostick`
