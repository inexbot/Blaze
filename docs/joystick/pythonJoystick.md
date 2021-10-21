---
sidebar_position: 1
---

# Python 脚本

我们尝试使用游戏手柄来操作机器人，探索示教机器人的更多可能性。

如何将手柄的按键信息转化为 NexDroid 系统的指令也是一个让人头痛的事情。最后我们使用 Python 脚本实现了这个功能，但是本方法仅适用于手柄，飞行摇杆不适用。

请扫码关注“纳博特科技 Inexbot”视频号，查看手柄操作机器人视频。

<img src="/img/videoqrcode.jpg" width="350" />

## 使用

1. 控制器需要连接到互联网，安装 xboxdrv `sudo apt-get install xboxdrv`
2. 下载[脚本文件](https://inexbot-use.oss-cn-shanghai.aliyuncs.com/joystick/pystick.zip)，解压后将所有文件放在`/home/inexbot/pystick`目录下
3. 控制器连接到手柄
4. 运行 main.py 脚本`sudo python3.4 /home/inexbot/pystick/main.py`

## 解析

### 读取按键

用到了 xboxdrv 驱动。

```python
import subprocess
import select
import time

class Joystick:

    def __init__(self,refreshRate = 30):
        self.proc = subprocess.Popen(['xboxdrv','--no-uinput','--detach-kernel-driver'], stdout=subprocess.PIPE, bufsize=0)
        self.pipe = self.proc.stdout
        self.connectStatus = False
        self.reading = '0' * 140
        self.refreshTime = 0
        self.refreshDelay = 1.0 / refreshRate

        found = False
        waitTime = time.time() + 2
        while waitTime > time.time() and not found:
            readable, writeable, exception = select.select([self.pipe],[],[],0)
            if readable:
                response = self.pipe.readline()
                if response[0:7] == b'No Xbox':
                    raise IOError('No Xbox controller/receiver found')
                if response[0:12].lower() == b'press ctrl-c':
                    found = True
                if len(response) == 140:
                    found = True
                    self.connectStatus = True
                    self.reading = response
        if not found:
            self.close()
            raise IOError('Unable to detect Xbox controller/receiver - Run python as sudo')

    def refresh(self):
        if self.refreshTime < time.time():
            self.refreshTime = time.time() + self.refreshDelay
            readable, writeable, exception = select.select([self.pipe],[],[],0)
            if readable:
                while readable:
                    response = self.pipe.readline()
                    if len(response) == 0:
                        raise IOError('Xbox controller disconnected from USB')
                    readable, writeable, exception = select.select([self.pipe],[],[],0)
                if len(response) == 140:
                    self.connectStatus = True
                    self.reading = response
                    self.connectStatus = False

    def connected(self):
        self.refresh()
        return self.connectStatus

    def leftX(self,deadzone=4000):
        self.refresh()
        raw = int(self.reading[3:9])
        return self.axisScale(raw,deadzone)

    def leftY(self,deadzone=4000):
        self.refresh()
        raw = int(self.reading[13:19])
        return self.axisScale(raw,deadzone)

    def rightX(self,deadzone=4000):
        self.refresh()
        raw = int(self.reading[24:30])
        return self.axisScale(raw,deadzone)

    def rightY(self,deadzone=4000):
        self.refresh()
        raw = int(self.reading[34:40])
        return self.axisScale(raw,deadzone)

    def axisScale(self,raw,deadzone):
        if abs(raw) < deadzone:
            return 0.0
        else:
            if raw < 0:
                return (raw + deadzone) / (32768.0 - deadzone)
            else:
                return (raw - deadzone) / (32767.0 - deadzone)

    def dpadUp(self):
        self.refresh()
        return int(self.reading[45:46])

    def dpadDown(self):
        self.refresh()
        return int(self.reading[50:51])

    def dpadLeft(self):
        self.refresh()
        return int(self.reading[55:56])

    def dpadRight(self):
        self.refresh()
        return int(self.reading[60:61])

    def Back(self):
        self.refresh()
        return int(self.reading[68:69])

    def Guide(self):
        self.refresh()
        return int(self.reading[76:77])

    def Start(self):
        self.refresh()
        return int(self.reading[84:85])

    def leftThumbstick(self):
        self.refresh()
        return int(self.reading[90:91])

    def rightThumbstick(self):
        self.refresh()
        return int(self.reading[95:96])

    def A(self):
        self.refresh()
        return int(self.reading[100:101])

    def B(self):
        self.refresh()
        return int(self.reading[104:105])

    def X(self):
        self.refresh()
        return int(self.reading[108:109])

    def Y(self):
        self.refresh()
        return int(self.reading[112:113])

    def leftBumper(self):
        self.refresh()
        return int(self.reading[118:119])

    def rightBumper(self):
        self.refresh()
        return int(self.reading[123:124])

    def leftTrigger(self):
        self.refresh()
        return int(self.reading[129:132]) / 255.0

    def rightTrigger(self):
        self.refresh()
        return int(self.reading[136:139]) / 255.0

    def leftStick(self,deadzone=4000):
        self.refresh()
        return (self.leftX(deadzone),self.leftY(deadzone))

    def rightStick(self,deadzone=4000):
        self.refresh()
        return (self.rightX(deadzone),self.rightY(deadzone))

    def close(self):
        self.proc.kill()
```

### 发送数据

比较麻烦的依然是组成数据包

```python
import socket
import json
import zlib
import time

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

def Connect(ip, port):
    try:
        s.connect((ip, port))
    except socket.error:
        time.sleep(3)
        Connect(ip, port)


def getBuffer(command, data):
    _preSend = bytearray()
    # get byte of data
    databyte = json.dumps(data).encode()
    # Length
    dataLength = databyte.__len__()
    dataLengthBytes = dataLength.to_bytes(
        length=2, byteorder="big", signed=False)
    # Command
    commandBytes = command.to_bytes(length=2, byteorder="big", signed=False)
    # _preSend
    _preSend.append(0x4E)
    _preSend.append(0x66)
    _preSend.extend(dataLengthBytes)
    _preSend.extend(commandBytes)
    _preSend.extend(databyte)
    # Crc32
    crc32Num = zlib.crc32(bytes(_preSend[2:]), 0)
    crc32Bytes = crc32Num.to_bytes(length=4, byteorder="big", signed=False)
    _preSend.extend(crc32Bytes)
    return bytes(_preSend)


def SendMessage(command, data):
    s.send(getBuffer(command, data))
```

### 连接并发送

下面就是需要将手柄的事件转化为数据发送给控制器。

```python
from __future__ import print_function
import xbox
import link
import time


link.Connect("127.0.0.1", 6001)
joy = xbox.Joystick()


def setServoToReady():
    link.SendMessage(0x2101, {"mode": 0})
    link.SendMessage(0x2001, {"robot": 1, "status": 1})


def setRobotEnable():
    link.SendMessage(0x2301, {"deadman": 1})


def setCoordToCart():
    link.SendMessage(0x2201, {"robot": 1, "coord": 1})


def setSpeed(speed):
    link.SendMessage(0x2601, {"robot": 1, "speed": speed})


def setRobotDisable():
    link.SendMessage(0x2301, {"deadman": 0})


def jogRobot(axis, direction):
    link.SendMessage(0x2901, {"axis": axis, "direction": direction})


def stopJog(axis):
    link.SendMessage(0x2902, {"axis": axis})


# default speed = 5
speed = 5

print("Press Back button to exit")
while not joy.Back():
    # A/B/X/Y buttons
    if joy.leftX() > 0.1:
        jogRobot(2, joy.leftX())
    if joy.leftX() < -0.1:
        jogRobot(2, joy.leftX())
    elif joy.leftX() <= 0.1 and joy.leftX() >= -0.1:
        stopJog(2)
    if joy.leftY() > 0.1:
        jogRobot(1, joy.leftY())
    if joy.leftY() < -0.1:
        jogRobot(1, joy.leftY())
    elif joy.leftY() <= 0.1 and joy.leftY() >= -0.1:
        stopJog(1)
    if joy.rightX() > 0.1:
        jogRobot(4, joy.rightX())
    if joy.rightX() < -0.1:
        jogRobot(4, joy.rightX())
    elif joy.rightX() <= 0.1 and joy.rightX() >= -0.1:
        stopJog(4)
    if joy.rightY() > 0.1:
        jogRobot(5, joy.rightY())
    if joy.rightY() < -0.1:
        jogRobot(5, joy.rightY())
    elif joy.rightY() <= 0.1 and joy.rightY() >= -0.1:
        stopJog(5)
    if joy.dpadUp():
        if speed <= 95:
            speed = speed + 5
            setSpeed(speed)
    if joy.dpadDown():
        if speed >= 5:
            speed = speed - 5
            setSpeed(speed)
    if joy.dpadLeft():
        print("dpadLeft")
    if joy.dpadRight():
        print("dpadRight")
    if joy.A():
        print("A")
        setRobotEnable()
    if joy.B():
        print("B")
        setRobotDisable()
    if joy.X():
        setServoToReady()
    if joy.Y():
        setCoordToCart()
    if joy.leftBumper():
        jogRobot(3, 1)
    if joy.rightBumper():
        jogRobot(3, -1)
    if joy.rightBumper() == 0 and joy.leftBumper() == 0:
        stopJog(3)
    if joy.leftThumbstick():
        print("leftThumbstick")
    if joy.rightThumbstick():
        print("rightThumbstick")
    if joy.leftTrigger():
        jogRobot(6, -1)
    if joy.rightTrigger():
        jogRobot(6, 1)
    if joy.rightTrigger() == 0 and joy.leftTrigger() == 0:
        stopJog(6)
    time.sleep(0.05)
    # Move cursor back to start of line
# Close out when done
joy.close()

```
