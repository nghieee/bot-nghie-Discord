const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

async function createWelcomeImage(username, avatarUrl) {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    // Load ảnh nền (đặt ảnh trong thư mục assets/)
    const background = await loadImage(path.join(__dirname, 'assets', 'welcome-bg.png'));
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Vẽ khung avatar
    const avatarSize = 100; 
    ctx.beginPath();
    ctx.arc(125, 150, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Load avatar
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.clip();
    ctx.drawImage(avatar, 75, 100, avatarSize, avatarSize);
    ctx.restore();

    // Thêm chữ chào mừng
    ctx.fillStyle = '#ffffff';
    let fontSize = 36;
    ctx.font = `bold ${fontSize}px Arial`;
    
    const maxTextWidth = 500;
    while (ctx.measureText(`Welcome, ${username}!`).width > maxTextWidth && fontSize > 20) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial`;
    }

    const textX = 250;
    const textY = 160;
    ctx.fillText(`Welcome, ${username}!`, textX, textY);

    return canvas.toBuffer();
}

module.exports = { createWelcomeImage };
