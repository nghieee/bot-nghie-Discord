const { PermissionsBitField, Colors, EmbedBuilder } = require("discord.js");
const { MEMBER_ROLE_ID, RULES_MESSAGE_ID, EMOJIS } = require('../../utils/constants');
const welcomeService = require('../welcome/welcomeService');

// ID của kênh welcome
const WELCOME_CHANNEL_ID = '1345285119237296129';

/**
 * Thiết lập quyền cho các kênh
 * @param {Guild} guild - Discord Guild
 */
async function setupChannelPermissions(guild) {
    try {
        const everyoneRole = guild.roles.everyone;
        const memberRole = guild.roles.cache.get(MEMBER_ROLE_ID);
        const welcomeChannel = guild.channels.cache.get(WELCOME_CHANNEL_ID);
        
        if (welcomeChannel && memberRole) {
            // Ẩn kênh welcome với everyone
            await welcomeChannel.permissionOverwrites.edit(everyoneRole, {
                ViewChannel: false
            });

            // Chỉ cho member xem kênh welcome
            await welcomeChannel.permissionOverwrites.edit(memberRole, {
                ViewChannel: true,
                ReadMessageHistory: true,
                SendMessages: false
            });
            console.log('✅ Đã cập nhật quyền cho kênh welcome');
        } else {
            console.error('Không tìm thấy kênh welcome hoặc role member');
        }
    } catch (error) {
        console.error('Lỗi khi thiết lập quyền kênh:', error);
    }
}

/**
 * Tạo các roles cần thiết cho server
 * @param {Guild} guild - Discord Guild
 */
async function createRoles(guild) {
    try {
        // Kiểm tra role Member
        let memberRole = guild.roles.cache.get(MEMBER_ROLE_ID);
        if (!memberRole) {
            memberRole = await guild.roles.create({
                name: 'Member',
                color: '#00ff00',
                reason: 'Role cho thành viên mới'
            });
            console.log('✅ Đã tạo role Member:', memberRole.id);
            console.log('⚠️ Vui lòng cập nhật MEMBER_ROLE_ID trong file .env:', memberRole.id);
        }

        // Thiết lập quyền cho kênh welcome
        await setupChannelPermissions(guild);

        return { memberRole };
    } catch (error) {
        console.error('❌ Lỗi khi tạo roles:', error);
        throw error;
    }
}

/**
 * Xử lý khi người dùng thêm reaction vào message rules
 * @param {MessageReaction} reaction - Discord MessageReaction
 * @param {User} user - Discord User
 */
async function handleRulesReaction(reaction, user) {
    if (user.bot) return;

    // Kiểm tra xem có phải tin nhắn rules không
    if (reaction.message.id !== RULES_MESSAGE_ID) return;

    // Kiểm tra emoji
    if (reaction.emoji.name !== EMOJIS.CHECK_MARK) return;

    try {
        // Lấy member từ user
        const member = await reaction.message.guild.members.fetch(user.id);
        
        // Thêm role Member
        const memberRole = reaction.message.guild.roles.cache.get(MEMBER_ROLE_ID);
        if (memberRole) {
            await member.roles.add(memberRole);
            console.log(`✅ Đã thêm role Member cho ${user.tag}`);

            // Gửi tin nhắn chào mừng trong kênh welcome
            const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
            if (welcomeChannel) {
                await welcomeService.sendWelcomeMessage(member, welcomeChannel);
            }
        } else {
            console.log('Không tìm thấy role Member');
        }
    } catch (error) {
        console.error(`❌ Lỗi khi thêm role cho ${user.tag}:`, error);
    }
}

/**
 * Xử lý khi người dùng xóa reaction khỏi message rules
 * @param {MessageReaction} reaction - Discord MessageReaction
 * @param {User} user - Discord User
 */
async function handleRulesReactionRemove(reaction, user) {
    if (user.bot) return;

    // Kiểm tra xem có phải tin nhắn rules không
    if (reaction.message.id !== RULES_MESSAGE_ID) return;

    // Kiểm tra emoji
    if (reaction.emoji.name !== EMOJIS.CHECK_MARK) return;

    try {
        // Lấy member từ user
        const member = await reaction.message.guild.members.fetch(user.id);
        
        // Xóa role Member
        const memberRole = reaction.message.guild.roles.cache.get(MEMBER_ROLE_ID);
        if (memberRole) {
            await member.roles.remove(memberRole);
            console.log(`✅ Đã xóa role Member của ${user.tag}`);
        }
    } catch (error) {
        console.error(`❌ Lỗi khi xóa role của ${user.tag}:`, error);
    }
}

// Chỉ owner mới có thể gán role "Mod"
async function assignModRole(message) {
    // Kiểm tra quyền admin
    if (!message.member.permissions.has('Administrator')) {
        return message.reply('❌ Bạn không có quyền sử dụng lệnh này!');
    }

    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
        return message.reply('⚠️ Vui lòng tag người dùng cần thêm role Mod. Ví dụ: !mod @user');
    }

    try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        const modRole = message.guild.roles.cache.find(role => role.name === 'Mod');
        
        if (!modRole) {
            return message.reply('❌ Không tìm thấy role Mod!');
        }

        await member.roles.add(modRole);
        message.reply(`✅ Đã thêm role Mod cho ${mentionedUser.tag}`);
    } catch (error) {
        console.error('Lỗi khi thêm role Mod:', error);
        message.reply('❌ Có lỗi xảy ra khi thêm role Mod!');
    }
}

module.exports = {
    createRoles,
    handleRulesReaction,
    handleRulesReactionRemove,
    assignModRole,
    setupChannelPermissions
};
