export const emojis = {
    coin: "<:money:945251649918738453>",
};

export class Response extends Error {
    constructor(response) {
        this.response = response;
    }
}
