export const error = Object.freeze({
    // common
    NOT_AUTHORIZED_DEV_ENV: "You cannot interact in development environment",
    NOT_AUTHORIZED_COMMAND: "You cannot use this command",
    USER_NOT_FOUND: "I could not find that user",

    // balance
    AMOUNT_NON_POSITIVE: "You must specify a positive amount",
    GIVE_SAME_USER: "You cannot give balance to yourself",
    INSUFFICIENT_BALANCE: "You don't have enough money",
    DAILY_ALREADY_CLAIMED: "You have already claimed your daily reward today",

    // baucua
    BAUCUA_ALREADY_RUNNING: "There is already an active game in this channel",
    BAUCUA_NO_ACTIVE_GAME: "There is no active game in this channel",
    BAUCUA_BETTING_CLOSED: "Betting is closed for this round",
});

export function getErrorMessage(err) {
    return error[err.message] || err.message;
}
