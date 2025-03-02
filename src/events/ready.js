const { createRoles } = require('../services/role/roleService');
const { RULES_MESSAGE_ID, DEFAULT_CHANNELS, EMOJIS } = require('../utils/constants');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Bot đã hoạt động: ${client.user.tag}`);

        // Lấy guild và tạo role nếu chưa có
        const guild = client.guilds.cache.get("1345032665740480563");
        if (guild) {
            await createRoles(guild);
            
            // Tìm kênh rules
            const rulesChannel = guild.channels.cache.find(ch => ch.name === DEFAULT_CHANNELS.RULES);
            if (rulesChannel) {
                try {
                    // Fetch tin nhắn rules
                    const rulesMessage = await rulesChannel.messages.fetch(RULES_MESSAGE_ID);
                    console.log('✅ Đã tìm thấy tin nhắn rules:', rulesMessage.id);
                    
                    // Thêm reaction ✅ nếu chưa có
                    const checkReaction = rulesMessage.reactions.cache.find(r => r.emoji.name === 'white_check_mark');
                    if (!checkReaction) {
                        await rulesMessage.react(EMOJIS.CHECK_MARK);
                        console.log('✅ Đã thêm reaction vào tin nhắn rules');
                    }
                } catch (error) {
                    console.error('❌ Lỗi khi fetch tin nhắn rules:', error);
                }
            } else {
                console.error('❌ Không tìm thấy kênh rules');
            }
        }
    }
}; 