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

    getEventListeners() {
        return this.eventListeners;
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

    async initMainListener(
        options = {
            channelIds: [],
            callbackOnline: () => {},
            callbackOffline: () => {},
        }
    ) {
        try {
            const authProvider = new StaticAuthProvider(
                this.appId,
                this.accessToken
            );
            const apiClient = new ApiClient({ authProvider });
            this.eventListeners = new EventSubWsListener({ apiClient });
            this.eventListeners.start();
            console.log("Started Twitch EventSub WebSocket Listener");
            console.log(
                "Initializing Twitch Listeners... " +
                    options.channelIds.length +
                    " channel" + (options.channelIds.length !== 1 ? "s" : "") 
            );

            if (
                options.channelIds &&
                Array.isArray(options.channelIds) &&
                options.channelIds.length > 0
            ) {
                for (const channelId of options.channelIds) {
                    this.listeners.push(this.eventListeners.onStreamOnline(
                        channelId, () => {
                            options.callbackOnline();
                        }
                    ));
                    this.listeners.push(this.eventListeners.onStreamOffline(
                        channelId, () => {
                            options.callbackOffline();
                        }
                    ));
                }
            }

            console.log(`Initialized:`, this.listeners.length, `Twitch listeners`);

            return true;
        } catch (error) {
            throw new Error(error);
        }
    }

    async stopMainListener() {
        try {
            const listenersCount = this.listeners.length;
            if (listenersCount > 0) {
                for (const listener of this.listeners) {
                    try {
                        await listener.stop();
                    } catch (error) {
                        throw new Error(error);
                    }
                }
                this.eventListeners.removeListener();
                console.log(`Removed ${listenersCount} Twitch event ${listenersCount !== 1 ? "listeners" : "listener"}`);

                this.listeners = [];
                this.eventListeners = null;
                console.log("Cleared all Twitch listeners and event listeners");
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    async performMaintenance(
        options = {
            channelIds: [],
            oncallbackOnline: () => {},
            oncallbackOffline: () => {},
        }
    ) {
        try {
            await this.stopMainListener();
            await this.refreshAccessToken(() => {
                console.log("Refreshed Twitch Access Token");
            });
            const valid = await this.checkToken();
            if (!valid) {
                throw new Error("Invalid Twitch Access Token");
            }
            await this.initMainListener(
                {
                    channelIds: options.channelIds || [],
                    callbackOnline: options.oncallbackOnline || (() => {}),
                    callbackOffline: options.oncallbackOffline || (() => {}),
                }
            );
        } catch (error) {
            throw new Error(error);
        }

        return true;
    }
}

module.exports = {
    TwitchBot,
};
