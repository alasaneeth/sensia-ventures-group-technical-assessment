export default function isNumber(number) {
    if(typeof number === "string") {
        return /^\d+.?\d*\b/.test(number);
    }
    
    return !isNaN(number) && number !== null && number !== undefined;
}