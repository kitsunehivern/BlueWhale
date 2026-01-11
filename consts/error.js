export const error = Object.freeze({
    // common
    NOT_AUTHORIZED_DEV_ENV: "You cannot interact in development environment",
    NOT_AUTHORIZED_COMMAND: "You cannot use this command",
    INVALID_INTEGER: "The token `%s` is not a valid integer",
    INVALID_LEQ_INTEGER: "The integer `%s` is not less than or equal to %d",
    INVALID_GEQ_INTEGER: "The integer `%s` is not greater than or equal to %d",
    INVALID_USER: "The token `%s` is not a valid user",
    INVALID_EXPRESSION: "The expression is invalid or could not be evaluated",
    INVALID_COMMAND_NAME: "The command `%s` is not recognized",
    USER_NOT_FOUND: "I could not find user `%s`",
    EVALUATION_TIMEOUT: "The evaluation took too long and was terminated",
    INVALID_COMMAND_USAGE: "The correct usage for this command is `%s`",
    INVALID_CHOICE: "The choice `%s` is not in the list including %s",

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
