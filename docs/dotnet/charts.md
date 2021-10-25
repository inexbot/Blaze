---
sidebar_position: 4
---

# 机器人数据示波器

我们尝试使用[LiveCharts2](https://github.com/beto-rodriguez/LiveCharts2)图形开源库制作了机器人数据示波器功能。

<img src="/img/dotnet/charts.png" align="center" />

## 源码

需要首先在 Nuget 中安装 LiveCharts2，具体说明都在源代码中加了注释。

### xaml 源码

```xml
<Window
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:MyProject"
        xmlns:charts="clr-namespace:LiveChartsCore.SkiaSharpView.WPF;assembly=LiveChartsCore.SkiaSharpView.WPF"
        xmlns:Converter="clr-namespace:MyProject.Converter" x:Class="MyProject.MainWindow"
        mc:Ignorable="d"
        Title="示波器" Height="800" Width="1280" Unloaded="Window_Unloaded">
    <Window.Resources>
        <Converter:ReverseBoolConverter x:Key="ReverseBoolConverter" />
    </Window.Resources>
    <Grid>
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="200" />
            <ColumnDefinition Width="*" />
        </Grid.ColumnDefinitions>
        <Grid x:Name="operateArea">
            <Grid.RowDefinitions>
                <RowDefinition Height="30" />
                <RowDefinition Height="*" />
            </Grid.RowDefinitions>
            <TextBlock Text="示波器" />
            <Grid Grid.Row="1">
                <Grid.RowDefinitions>
                    <RowDefinition Height="90" />
                    <RowDefinition Height="30" />
                    <RowDefinition Height="*" />
                </Grid.RowDefinitions>
                <Grid Grid.Row="0">
                    <Grid.RowDefinitions>
                        <RowDefinition Height="30" />
                        <RowDefinition Height="30" />
                        <RowDefinition Height="30" />
                    </Grid.RowDefinitions>
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="50" />
                        <ColumnDefinition Width="80" />
                        <ColumnDefinition Width="70" />
                    </Grid.ColumnDefinitions>
                    <TextBlock Text="采样周期" Grid.Column="0" Grid.Row="0" />
                    <TextBox x:Name="cycle" Text="100" TextChanged="cycleAndNumTextChanged" Grid.Row="0" Grid.Column="1" />
                    <TextBlock Text="10~200ms" Grid.Column="2" Grid.Row="0" />
                    <TextBlock Text="采样点数" Grid.Column="0" Grid.Row="1" />
                    <TextBox x:Name="num" Text="20" TextChanged="cycleAndNumTextChanged" Grid.Row="1" Grid.Column="1" LostFocus="cycleAndNumLostFocus" />
                    <TextBlock Text="10~200" x:Name="maxNum" Grid.Column="2" Grid.Row="1" />
                    <TextBlock Text="总时长" Grid.Row="2" Grid.Column="0" />
                    <TextBlock x:Name="wholeTime" Text="2" Grid.Row="2" Grid.Column="1" />
                    <TextBlock Text="s" Grid.Row="2" Grid.Column="2" />
                </Grid>
                <Button x:Name="sendRequest" Click="sendRequest_Click" Grid.Row="1" Content="发送" />
                <Grid Grid.Row="2" x:Name="checkGrid">
                    <Grid.RowDefinitions>
                        <RowDefinition Height="*" />
                        <RowDefinition Height="*" />
                        <RowDefinition Height="30" />
                    </Grid.RowDefinitions>
                    <ListBox Grid.Row="0" x:Name="type" SelectionChanged="type_SelectionChanged">
                        <RadioButton x:Name="realPosACS" Content="关节位置" />
                        <RadioButton x:Name="realPosMCS" Content="直角位置" />
                        <RadioButton x:Name="torque" Content="电机力矩" />
                        <RadioButton x:Name="axisAcc" Content="轴加速度" />
                        <RadioButton x:Name="axisVel" Content="轴速度" />
                        <RadioButton x:Name="electric" Content="电流" />
                    </ListBox>
                    <ListBox Grid.Row="1" x:Name="axis" SelectionChanged="axis_SelectionChanged" />
                    <Button x:Name="check" Click="check_Click" Grid.Row="2" Content="查看" />
                </Grid>
            </Grid>
        </Grid>
        <charts:CartesianChart Series="{Binding Series}" ZoomMode="Both" Grid.Column="1" />
    </Grid>
</Window>
```

### 后台源码

```csharp
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;
using MyProject.Model;
using MyProject.Tcp;

namespace IPD.Dialogs
{
    /// <summary>
    /// ChartsWindowxaml.xaml 的交互逻辑
    /// </summary>
    public partial class ChartsWindow : Window
    {
        private Charts charts = Charts.GetInstance;
        //使用了TcpLibrary，使用7000端口连接到控制器
        private Client7000 client = Client7000.GetInstance();
        //机器人的基本状态，这里的要用到robotCommon.RobotType.AxisSum来确定机器人轴数
        //robotCommon.CurrentRobot表示当前机器人的序号
        private RobotCommon robotCommon = RobotCommon.GetInstance;

        public ChartsWindow()
        {
            InitializeComponent();
            //设置窗口的数据源为Charts类的实例
            this.DataContext = charts;
            //连接到控制器的7000端口
            client.Connect();
            setCheckBox();
            checkGrid.IsEnabled = false;
        }

        //设置机器人轴数选择框
        private void setCheckBox()
        {
            for (int i = 1; i <= robotCommon.RobotType.AxisSum; i++)
            {
                CheckBox ck = new CheckBox();
                ck.Content = "轴" + i.ToString();
                axis.RegisterName("axis" + i.ToString(), ck);
                axis.Items.Add(ck);
            }
        }

        //发送数据请求，这里使用控制器的7000端口数据获取功能
        private void sendRequest_Click(object sender, RoutedEventArgs e)
        {
            charts.ClearValues();
            sendRequest.IsEnabled = false;
            checkGrid.IsEnabled = false;
            string data = "{\"channel\": 1,\"stop\": 0,\"robot\": " + robotCommon.CurrentRobot.ToString() + ",\"mode\": 1,\"interval\": " + cycle.Text + ",\"queryType\": [\"realPosACS\", \"realPosMCS\", \"realPosPCS\", \"realPosUCS\",\"axisVel\", \"axisAcc\",\"torque\", \"electric\"],\"typeCfg\": {}}";
            client.SendMessage(0x9512, data);
            System.Timers.Timer requestTimer = new System.Timers.Timer();
            requestTimer.Interval = int.Parse(cycle.Text) * int.Parse(num.Text);
            requestTimer.AutoReset = false;
            requestTimer.Elapsed += new System.Timers.ElapsedEventHandler(request);
            requestTimer.Enabled = true;
        }

        private void request(object source, System.Timers.ElapsedEventArgs e)
        {
            string data = "{\"channel\": 1,\"stop\": 1,\"robot\": " + robotCommon.CurrentRobot.ToString() + ",\"mode\": 1,\"interval\": 600,\"queryType\": [\"realPosACS\", \"realPosMCS\", \"realPosPCS\", \"realPosUCS\",\"axisVel\", \"axisAcc\",\"torque\", \"electric\"],\"typeCfg\": {}}";
            client.SendMessage(0x9512, data);
            //多线程控制界面需要用Dispatcher Invoke
            Action<Button, bool> setRequestButtonEnable = new Action<Button, bool>(updateRequestIsEnabled);
            sendRequest.Dispatcher.Invoke(setRequestButtonEnable, sendRequest, true);
            Action<Grid, bool> setCheckGridEnable = new Action<Grid, bool>(updateCheckGridIsEnabled);
            sendRequest.Dispatcher.Invoke(setCheckGridEnable, checkGrid, true);
        }

        private void updateRequestIsEnabled(Button bt, bool isEnabled)
        {
            sendRequest.IsEnabled = isEnabled;
        }

        private void updateCheckGridIsEnabled(Grid gd, bool isEnabled)
        {
            checkGrid.IsEnabled = isEnabled;
        }
        //周期和个数输入框填写回调
        private void cycleAndNumTextChanged(object sender, TextChangedEventArgs e)
        {
            int cycleInt;
            int numInt;
            try
            {
                if (cycle == null || num == null || wholeTime == null) { return; }
                cycleInt = int.Parse(cycle.Text);
                numInt = int.Parse(num.Text);
                maxNum.Text = "10~" + (20000 / cycleInt).ToString();
                wholeTime.Text = (Convert.ToDouble(cycleInt * numInt) / 1000).ToString("0.00");
            }
            catch
            {
                wholeTime.Text = "输入错误！";
            }
        }

        private void cycleAndNumLostFocus(object sender, RoutedEventArgs e)
        {
            int cycleInt;
            int numInt;
            try
            {
                if (cycle == null || num == null || wholeTime == null) { return; }
                cycleInt = int.Parse(cycle.Text);
                numInt = int.Parse(num.Text);
                if (numInt >= (20000 / cycleInt))
                {
                    num.Text = (20000 / cycleInt).ToString();
                }
                else if (numInt < 10)
                {
                    num.Text = 10.ToString();
                }
            }
            catch
            {
                wholeTime.Text = "输入错误！";
            }
        }

        //查看数据
        private void check_Click(object sender, RoutedEventArgs e)
        {
            List<int> axisList = new List<int>();
            string typeString = null;
            for (int i = 0; i < type.Items.Count; i++)
            {
                RadioButton rd = (RadioButton)type.Items.GetItemAt(i);
                if (rd.IsChecked == true)
                {
                    typeString = rd.Name;
                }
            }
            for (int i = 1; i <= robotCommon.RobotType.AxisSum; i++)
            {
                CheckBox ck = (CheckBox)type.FindName("axis" + i.ToString());
                if (ck.IsChecked == true)
                {
                    axisList.Add(i);
                }
            }
            if (axisList.Count == 0 || typeString == null)
            {
                MessageBox.Show("至少选择一个轴或类型！");
                return;
            }
            charts.ChangeCharts(axisList, typeString);
        }

        private void type_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            ((RadioButton)type.SelectedItem).IsChecked = true;
        }

        private void axis_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            ((CheckBox)axis.SelectedItem).IsChecked = !((CheckBox)axis.SelectedItem).IsChecked;
        }

        //关闭界面断开连接
        protected override void OnClosing(CancelEventArgs e)
        {
            base.OnClosing(e);
            if (client.clientBase.clientChannel != null && client.clientBase.clientChannel.Active)
            {
                client.clientBase.clientChannel.CloseAsync();
            };
        }

        //关闭界面断开连接
        private void Window_Unloaded(object sender, RoutedEventArgs e)
        {
            if (client.clientBase.clientChannel != null && client.clientBase.clientChannel.Active)
            {
                client.clientBase.clientChannel.CloseAsync();
            };
        }
    }
}
```

### ViewModel

用到了[Newtonsoft.Json](https://www.nuget.org/packages/Newtonsoft.Json/)

定义 ModuleBase 基类,用来通知界面数据改变。

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace MyProject.Common
{
    public class ModuleBase : INotifyPropertyChanged
    {
        public void UpdateProperty<T>(ref T properValue, T newValue, [CallerMemberName] string propertyName = "")
        {
            if (Equals(properValue, newValue))
            {
                return;
            }
            properValue = newValue;
            OnPropertyChanged(propertyName);
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string propertyName = "")
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
```

ViewModel

```csharp
using System.Collections.Generic;
using MyProject.Common;
using Newtonsoft.Json;
using SkiaSharp;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;

namespace IPD.Model
{
    public class Charts : ModuleBase
    {
        private readonly static object lockObj = new object();
        private static Charts instance = null;
        private List<ReplyData> replyList = new List<ReplyData>();

        public static Charts GetInstance
        {
            get
            {
                if (instance == null)
                {
                    lock (lockObj)
                    {
                        if (instance == null)
                        {
                            instance = new Charts();
                        }
                    }
                }
                return instance;
            }
        }
        //将请求-停止的时间内所有数据放到ReplyList中
        public List<ReplyData> ReplyList { get => replyList; set => UpdateProperty(ref replyList, value); }

        private List<ISeries> series = new List<ISeries>
        {
            new LineSeries<double, LiveChartsCore.SkiaSharpView.Drawing.Geometries.RectangleGeometry>
            {
                Values = new List<double>{1,2,3,4,5,6,7},
                Name="demo",
                Fill = null,
                LineSmoothness = 1
            },
        };

        //图表的线条List
        public List<ISeries> Series { get => series; set => UpdateProperty(ref series, value); }

        //接收控制器数据后将数据放到ReplyList中
        public void ChangeValues(string data)
        {
            ReplyRoot v = JsonConvert.DeserializeObject<ReplyRoot>(data);
            ReplyList.Add(v.replyData);
        }
        //清空ReplyList
        public void ClearValues()
        {
            ReplyList.Clear();
        }
        //修改界面的图表显示方法，接收轴和数据类型
        public void ChangeCharts(List<int> axis, string type)
        {
            List<ISeries> ns = new List<ISeries>();
            axis.ForEach(v =>
            {
                List<double> list = new List<double>();
                switch (type)
                {
                    case "realPosACS":
                        ReplyList.ForEach(c =>
                        {
                            list.Add(c.realPosACS[v - 1]);
                        });
                        break;

                    case "realPosMCS":
                        ReplyList.ForEach(c =>
                        {
                            list.Add(c.realPosMCS[v - 1]);
                        });
                        break;

                    case "realPosPCS":
                        ReplyList.ForEach(c =>
                        {
                            list.Add(c.realPosPCS[v - 1]);
                        });
                        break;

                    case "torque":
                        ReplyList.ForEach(c =>
                        {
                            list.Add(c.torque[v - 1]);
                        });
                        break;

                    case "axisAcc":
                        ReplyList.ForEach(c =>
                        {
                            list.Add(c.axisAcc[v - 1]);
                        });
                        break;

                    case "axisVel":
                        ReplyList.ForEach(c =>
                        {
                            list.Add(c.axisVel[v - 1]);
                        });
                        break;

                    case "electric":
                        ReplyList.ForEach(c =>
                        {
                            list.Add(c.electric[v - 1]);
                        });
                        break;

                    default:
                        break;
                }

                ns.Add(new LineSeries<double>
                {
                    Values = list,
                    Name = v.ToString() + "轴",
                    Fill = null,
                    LineSmoothness = 1
                });
            });
            Series = ns;
        }
    }

    public class ReplyData
    {
        /// <summary>
        /// </summary>
        public List<double> axisAcc { get; set; }

        /// <summary>
        /// </summary>
        public List<double> axisVel { get; set; }

        /// <summary>
        /// </summary>
        public List<double> electric { get; set; }

        /// <summary>
        /// </summary>
        public List<double> realPosACS { get; set; }

        /// <summary>
        /// </summary>
        public List<double> realPosMCS { get; set; }

        /// <summary>
        /// </summary>
        public List<double> realPosPCS { get; set; }

        /// <summary>
        /// </summary>
        public List<double> realPosUCS { get; set; }

        /// <summary>
        /// </summary>
        public List<double> torque { get; set; }
    }

    public class ReplyRoot
    {
        /// <summary>
        /// </summary>
        public int channel { get; set; }

        /// <summary>
        /// </summary>
        public ReplyData replyData { get; set; }

        /// <summary>
        /// </summary>
        public int robot { get; set; }
    }
}
```
