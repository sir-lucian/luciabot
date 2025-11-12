require("dotenv/config");

module.exports = {
    id: process.env.DC_GUILD_ID_NEKOSOUL,
    channels: [],
    alert: {
        twitch_id: process.env.TTV_ID_NEKOSOUL,
        channel_id: process.env.DC_CHANNEL_NEKOSOUL_ALERT,
        message: `**Soul-chan just went live!**\nLet's go visit the rabbit house! :heart:\nhttps://twitch.tv/nekoso_ul`,
    }
}