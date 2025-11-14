const embedsAuthor = {
    name: "Lucia (@lucialatte_)",
    iconURL: "https://lucian.solutions/images/335.png",
}

const embedsFooter = {
    iconURL: "https://lucian.solutions/images/4.png",
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