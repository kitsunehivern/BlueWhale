export class HelperUtils {
    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static deepMapToObject(map) {
        const obj = {};
        for (const [key, value] of map.entries()) {
            obj[key] =
                value instanceof Map ? this.deepMapToObject(value) : value;
        }

        return obj;
    }

    static deepObjectToMap(obj) {
        const map = new Map();
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            map.set(
                key,
                value !== null &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                    ? this.deepObjectToMap(value)
                    : value
            );
        }

        return map;
    }
}
