export const error = Object.freeze({
    NOT_AUTHORIZED_DEV_ENV: "You cannot interact in development environment",
    NOT_AUTHORIZED_COMMAND: "You cannot use this command",
    AMOUNT_NON_POSITIVE: "You must specify a positive amount",
    GIVE_SAME_USER: "You cannot give balance to yourself",
    INSUFFICIENT_BALANCE: "You don't have enough money",
    USER_NOT_FOUND: "I could not find that user",
    DAILY_ALREADY_CLAIMED: "You have already claimed your daily reward today",
});

export function getErrorMessage(err) {
    return error[err.message] || err.message;
}
