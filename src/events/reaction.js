const { handleRulesReaction, handleRulesReactionRemove } = require('../services/role/roleService');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        console.log('=== Nhận được reaction ===');
        console.log('Reaction từ user:', user.tag);
        console.log('Trên message:', reaction.message.id);
        console.log('Emoji:', reaction.emoji.name);
        console.log('Emoji ID:', reaction.emoji.id);
        console.log('Emoji full:', reaction.emoji.toString());
        
        // Nếu reaction chưa cached, fetch nó
        if (reaction.partial) {
            try {
                console.log('Reaction là partial, đang fetch...');
                await reaction.fetch();
                console.log('Đã fetch reaction thành công');
            } catch (error) {
                console.error('Lỗi khi fetch reaction:', error);
                return;
            }
        }

        // Fetch message nếu chưa có đầy đủ thông tin
        if (reaction.message.partial) {
            try {
                console.log('Message là partial, đang fetch...');
                await reaction.message.fetch();
                console.log('Đã fetch message thành công');
            } catch (error) {
                console.error('Lỗi khi fetch message:', error);
                return;
            }
        }

        await handleRulesReaction(reaction, user);
    },

    reactionRemove: {
        name: 'messageReactionRemove',
        async execute(reaction, user) {
            // Nếu reaction chưa cached, fetch nó
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    console.error('Lỗi khi fetch reaction:', error);
                    return;
                }
            }

            await handleRulesReactionRemove(reaction, user);
        }
    }
}; 