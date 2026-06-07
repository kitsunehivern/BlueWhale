export const error = Object.freeze({
    NOT_AUTHORIZED_DEV_ENV: () => "You cannot interact in development environment",
    NOT_AUTHORIZED_COMMAND: () => "You cannot use this command",
    INVALID_INTEGER: (token) => `The token \`${token}\` is not a valid integer`,
    INVALID_LEQ_INTEGER: (token, max) => `The integer \`${token}\` is not less than or equal to ${max}`,
    INVALID_GEQ_INTEGER: (token, min) => `The integer \`${token}\` is not greater than or equal to ${min}`,
    INVALID_USER: (token) => `The token \`${token}\` is not a valid user`,
    INVALID_EXPRESSION: () => "The expression is invalid or could not be evaluated",
    INVALID_COMMAND_NAME: (name) => `The command \`${name}\` is not recognized`,
    USER_NOT_FOUND: (token) => `I could not find user \`${token}\``,
    EVALUATION_TIMEOUT: () => "The evaluation took too long and was terminated",
    INVALID_COMMAND_USAGE: (usage) => `The correct usage for this command is \`${usage}\``,
    INVALID_CHOICE: (choice, list) => `The choice \`${choice}\` is not in the list: ${list}`,
    AMOUNT_NON_POSITIVE: () => "You must specify a positive amount",
    GIVE_SAME_USER: () => "You cannot give balance to yourself",
    INSUFFICIENT_BALANCE: () => "You don't have enough money",
    DAILY_ALREADY_CLAIMED: () => "You have already claimed your daily reward today",
    BAUCUA_ALREADY_RUNNING: () => "There is already an active game in this channel",
    BAUCUA_NO_ACTIVE_GAME: () => "There is no active game in this channel",
    BAUCUA_BETTING_CLOSED: () => "Betting is closed for this round",
});

export function getErrorMessage(err) {
    const fn = error[err.message];
    return typeof fn === "function" ? fn() : err.message;
}
