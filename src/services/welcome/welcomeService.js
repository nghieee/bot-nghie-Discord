const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');

/**
 * Tạo ảnh chào mừng
 * @param {string} username - Tên người dùng
 * @param {string} avatarUrl - URL avatar
 * @returns {Promise<Buffer>}
 */
async function createWelcomeImage(username, avatarUrl) {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    // Load ảnh nền
    const background = await loadImage(path.join(__dirname, '../../assets/welcome-bg.png'));
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Vẽ khung avatar nhỏ hơn
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

    // Thêm chữ chào mừng với kích thước linh hoạt
    ctx.fillStyle = '#ffffff';
    let fontSize = 40;
    ctx.font = `bold ${fontSize}px Arial`;

    // Giới hạn chiều rộng của chữ, giảm font nếu quá dài
    const maxTextWidth = 500;
    while (ctx.measureText(`Welcome, ${username}!`).width > maxTextWidth && fontSize > 20) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial`;
    }

    // Căn giữa chữ
    const textX = 250;
    const textY = 160;
    ctx.fillText(`Welcome, ${username}!`, textX, textY);

    return canvas.toBuffer();
}

/**
 * Gửi tin nhắn chào mừng
 * @param {GuildMember} member - Thành viên mới
 * @param {TextChannel} channel - Kênh welcome
 */
async function sendWelcomeMessage(member, channel) {
    try {
        // Tạo ảnh chào mừng
        const imageBuffer = await createWelcomeImage(
            member.user.username,
            member.user.displayAvatarURL({ extension: 'png' })
        );
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

        // Tạo Embed
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎉 Chào mừng bạn đến với server!')
            .setDescription(
                `Hey ${member}, chào mừng bạn đến với Airdrop cùng Hiu Nguyễn!🎉🎊\n\n` +
                `🎯 Nếu bạn chưa biết airdrop là gì, \nhãy đến <#1345331443861159936> 🎯\n\n` +
                `Cảm ơn bạn đã tham gia! 🚀`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage('attachment://welcome.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Chào mừng thành viên mới!',
                iconURL: member.guild.iconURL()
            });

        // Gửi tin nhắn với ảnh và embed
        await channel.send({ embeds: [welcomeEmbed], files: [attachment] });
        console.log(`✅ Đã gửi tin nhắn chào mừng đến ${member.user.tag}`);
    } catch (error) {
        console.error('❌ Lỗi khi gửi tin nhắn chào mừng:', error);
    }
}

module.exports = {
    sendWelcomeMessage,
    createWelcomeImage
};
