// popup.js

// Generate a random user ID
const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
console.log("UserID: ", userId);

// Function to create popup structure
function createPopup() {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '999';

    const popup = document.createElement('div');
    popup.id = 'popup';
    popup.style.display = 'none';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = '#fff';
    popup.style.padding = '20px';
    popup.style.borderRadius = '10px';
    popup.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
    popup.style.zIndex = '1000';
    popup.style.width = '80%'; // 宽度相对于屏幕大小
    popup.style.maxWidth = '400px'; // 最大宽度
    popup.style.boxSizing = 'border-box';

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.border = 'none';
    closeButton.style.background = 'transparent';
    closeButton.style.color = '#333'; // 默认颜色
    closeButton.style.fontSize = '20px'; // 字体大小
    closeButton.style.cursor = 'pointer';
    closeButton.style.width = '30px'; // 设置按钮大小
    closeButton.style.height = '30px';
    closeButton.style.display = 'flex'; // 让内容居中
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.borderRadius = '50%'; // 圆形按钮
    closeButton.style.transition = 'background-color 0.2s, color 0.2s'; // 添加过渡效果

    // 鼠标悬停效果
    closeButton.onmouseover = () => {
        closeButton.style.backgroundColor = '#f0f0f0'; // 背景变浅灰
        closeButton.style.color = '#000'; // 字体变深色
    };
    closeButton.onmouseout = () => {
        closeButton.style.backgroundColor = 'transparent'; // 恢复背景
        closeButton.style.color = '#333'; // 恢复字体颜色
    };

    // 点击事件
    closeButton.onclick = hidePopup;

    const popupImage = document.createElement('img');
    popupImage.id = 'popupImage';
    popupImage.src = imageDictionary.default;
    popupImage.alt = 'Popup Image';
    popupImage.style.width = '100%'; // 图片宽度填满弹窗
    popupImage.style.borderRadius = '10px'; // 圆角效果
    popupImage.style.marginBottom = '10px';

    const popupButton = document.createElement('button');
    popupButton.id = 'popupButton';
    popupButton.innerText = 'Click Me';
    popupButton.style.display = 'block';
    popupButton.style.width = '100%'; // 按钮宽度自适应
    popupButton.style.padding = '10px';
    popupButton.style.backgroundColor = '#007BFF';
    popupButton.style.color = '#fff';
    popupButton.style.border = 'none';
    popupButton.style.borderRadius = '5px';
    popupButton.style.fontSize = '16px';
    popupButton.style.cursor = 'pointer';

    popupButton.onclick = trackClick;

    popup.appendChild(closeButton);
    popup.appendChild(popupImage);
    popup.appendChild(popupButton);
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

// Function to show the popup
function showPopup(imageKey) {
    const imageUrl = imageDictionary[imageKey] || imageDictionary.default;
    console.log("=== Show Pic: ", imageUrl);
    document.getElementById('popupImage').src = imageUrl;
    document.getElementById('popup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// Function to hide the popup
function hidePopup() {
    document.getElementById('popup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Function to track button click
function trackClick() {
    fetch('/ab/track?name=var1', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-Env': 'dev',
        },
        body: JSON.stringify({ 'CTR': 1 })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from /api/set:', data);
        hidePopup();
    })
    .catch(error => console.error('Error sending data:', error));
}

// Fetch value from /api/get
function initPopup() {
    fetch('/ab/var?name=var1', {
        headers: {
            'X-User-Id': userId,
            'X-Env': 'dev',
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log("=== Get Data: ", data);
            if (data.value) {
                showPopup(data.value);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    createPopup();
    initPopup();
});
