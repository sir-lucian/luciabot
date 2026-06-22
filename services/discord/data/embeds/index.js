const embedsAuthor = {
    name: "Lucia (@lucialatte_)",
    iconURL: "https://cdn.bsky.app/img/avatar/plain/did:plc:e4jttv7vf75xgaa3ku5rfndw/bafkreic25y7qtdboo7gaa6yep7gaxqft37dj5jkgow6vxzqmioibbfvmwq",
}

const embedsFooter = {
    iconURL: "https://cdn.bsky.app/img/avatar/plain/did:plc:e4jttv7vf75xgaa3ku5rfndw/bafkreic25y7qtdboo7gaa6yep7gaxqft37dj5jkgow6vxzqmioibbfvmwq",
    text: "Lucian Solutions",
}

class Embeds {
    constructor() {
        this.author = embedsAuthor;
        this.footer = embedsFooter;
    }

    getEmbedsAuthor() {
        return this.author;
    }

    getEmbedsFooter() {
        return this.footer;
    }
}

module.exports = {
    Embeds,
}