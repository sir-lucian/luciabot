const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");

class TwitchBot {
    constructor({ appId, appSecret, refreshToken }) {
        this.refreshToken = refreshToken;
        this.accessToken = null;
        this.appId = appId;
        this.appSecret = appSecret;
        this.eventListeners = null;
        this.listeners = [];
    }

    async refreshAccessToken(onRefreshToken = () => {}) {
        let headers = new Headers();
        headers.append(`Content-Type`, `application/json`);

        let body = {
            client_id: this.appId,
            client_secret: this.appSecret,
            grant_type: "refresh_token",
            refresh_token: encodeURIComponent(this.refreshToken),
        };

        const request = new Request("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
        });
        const response = await fetch(request);
        const response_json = await response.json();
        const newAccessToken = response_json.access_token;

        if (newAccessToken) {
            this.accessToken = newAccessToken;
        }
        
        if (onRefreshToken && typeof onRefreshToken === "function") {
            onRefreshToken();
        }
    }

    async checkToken() {
        let headers = new Headers();
        headers.append(`Authorization`, `OAuth ${this.accessToken}`);
        const response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
            method: "GET",
            headers: headers,
            redirect: "follow",
        });
        let valid = response.status === 200 ? true : false;
        return valid;
    }

    async initMainListener(options = {
        channelIds: [],
        callbackOnline: () => {},
        callbackOffline: () => {},
    }) {
        try {
            const authProvider = new StaticAuthProvider(
                this.appId,
                this.accessToken
            );
            const apiClient = new ApiClient({ authProvider });
            this.eventListeners = new EventSubWsListener({ apiClient });
            this.eventListeners.start();

            if (options.channelIds && Array.isArray(options.channelIds) && options.channelIds.length > 0) {
                for (const channelId of options.channelIds) {
                    this.listeners.push(
                        new TwitchListener().initListener(
                            channelId,
                            () => {
                                options.callbackOnline();
                            },
                            () => {
                                options.callbackOffline();
                            }
                        )
                    );
                }
            }

            return true;
        } catch (error) {
            throw new Error(error);
        }
    }

    async stopMainListener() {
        try {
            if (this.listeners.length > 0) {
                for (const listener of this.listeners) {
                    await listener.stopListener();
                }
                this.eventListeners.removeListener();
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    async performMaintenance(options = {
        oncallbackOnline: () => {},
        oncallbackOffline: () => {}
    }) {
        try {
            await this.stopMainListener();
            await this.refreshAccessToken();
            const valid = await this.checkToken();
            if (!valid) {
                throw new Error("Invalid Twitch Access Token");
            }
            await this.initMainListener(
                options.oncallbackOnline,
                options.oncallbackOffline
            );
        } catch (error) {
            throw new Error(error);
        }
        
        return true;
    }
}

class TwitchListener {
    constructor() {
        this.onlineListener = null;
        this.offlineListener = null;
    }

    async initListener(channelId, callbackOnline = () => {}, callbackOffline = () => {}) {
        try {
            this.onlineListener = listeners.onStreamOnline(
                channelId,
                callbackOnline
            );
            this.offlineListener = listeners.onStreamOffline(
                channelId,
                callbackOffline
            );
        } catch (error) {
            throw new Error(error);
        }
    }

    async stopListener() {
        try {
            if (this.onlineListener) {
                await this.onlineListener.stop();
            }
            if (this.offlineListener) {
                await this.offlineListener.stop();
            }
        } catch (error) {
            throw new Error(error);
        }
    }
}

module.exports = {
    TwitchBot,
    TwitchListener,
};
