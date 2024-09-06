// 连接到 EMQX WebSocket 服务器
const client = mqtt.connect('ws://192.168.0.107:8083/mqtt');

// 用于存储从 MQTT 消息中提取的客户端 MAC 地址
let clientMacAddress = "";

// 用于存储当前 LED 状态
let currentLedState = "";

// 当连接成功时
client.on('connect', function () {
    console.log('Connected to MQTT broker');
    // 订阅 "monitor_topic" 主题以接收设备状态消息
    client.subscribe('monitor_topic', function (err) {
        if (!err) {
            console.log('Subscribed to topic: monitor_topic');
        }
    });

    // 订阅 "control_topic" 主题以接收控制命令的返回消息
    client.subscribe('control_topic', function (err) {
        if (!err) {
            console.log('Subscribed to topic: control_topic');
        }
    });
});

// 当收到消息时
client.on('message', function (topic, message) {
    // 将消息解析为 JSON 对象
    let data;
    try {
        data = JSON.parse(message.toString());
        // 存储 MAC 地址
        clientMacAddress = data.client_mac_address || clientMacAddress;
    } catch (e) {
        console.error('Error parsing JSON:', e);
        return;
    }

    // 只显示最新的消息
    const messageDiv = document.getElementById('messages');
    const statusDiv = document.getElementById('status');
    const ledStatusDiv = document.getElementById('ledStatus');
    
    // 清空 messageDiv
    messageDiv.innerHTML = '';

    // 创建一个列表元素
    const list = document.createElement('ul');
    list.className = 'list-group';

    // 遍历 JSON 对象的键值对
    for (const [key, value] of Object.entries(data)) {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.innerHTML = `<strong>${key}:</strong> ${value}`;
        list.appendChild(listItem);
    }

    // 将列表添加到消息显示区域
    messageDiv.appendChild(list);

    if (data.device === 'led' && data.action) {
        currentLedState = data.action;
        ledStatusDiv.textContent = `Status: ${data.action},resp:${data.msg}`;
        ledStatusDiv.className = `alert ${data.action === 'on' ? 'alert-success' : 'alert-danger'}`;
    }
});

// 错误处理
client.on('error', function (error) {
    console.error('Connection error: ', error);
});

// 处理打开LED按钮的点击事件
document.getElementById('ledOnButton').addEventListener('click', function() {
    const message = JSON.stringify({
        unix_time: Math.floor(Date.now() / 1000), // 当前 UNIX 时间戳
        source_ip_address: client.options.hostname, // 使用客户端的 IP 地址作为源 IP
        client_mac_address: clientMacAddress, // 获取上传过来的 MAC 地址
        device: 'led',
        action: 'on'
    });

    console.log('Published message to turn on LED:', message);
    // 发布消息到 MQTT
    client.publish('control_topic', message, { qos: 1, retain: false });
});

// 处理关闭LED按钮的点击事件
document.getElementById('ledOffButton').addEventListener('click', function() {
    const message = JSON.stringify({
        unix_time: Math.floor(Date.now() / 1000),
        source_ip_address: client.options.hostname, 
        client_mac_address: clientMacAddress,
        device: 'led',
        action: 'off'
    });

    console.log('Published message to turn off LED:', message);
    // 发布消息到 MQTT
    client.publish('control_topic', message, { qos: 1, retain: false });
});
