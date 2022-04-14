"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeToString = exports.neg = exports.max = exports.min = exports.divide = exports.multiply = exports.subtract = exports.add = exports.concatZeros = exports.getBorrowedAmountWadsWithInterest = exports.tokenToCToken = exports.cTokenToToken = exports.getDecimals = exports.toBaseUnit = exports.toHuman = exports.getTokenInfo = exports.BZero = exports.BNaN = exports.BWANG = exports.BRAY = exports.BWAD = exports.BNumber = exports.WAD = exports.U64_MAX = exports.getReserveInfo = void 0;
const production_json_1 = __importDefault(require("./production.json"));
const bn_js_1 = __importDefault(require("bn.js"));
const lodash_1 = require("lodash");
function getReserveInfo(symbol) {
    var _a, _b;
    const solendInfo = production_json_1.default;
    const tokenInfo = solendInfo.assets.find((ass) => ass.symbol === symbol);
    if (!tokenInfo) {
        throw new Error(`Could not find token info for ${symbol}.`);
    }
    const reserveInfo = (_b = (_a = solendInfo.markets) === null || _a === void 0 ? void 0 : _a.find((mar) => mar.name === "main")) === null || _b === void 0 ? void 0 : _b.reserves.find((ass) => ass.asset === symbol);
    if (!reserveInfo) {
        throw new Error(`Could not find ${symbol} in main market.`);
    }
    const oracleInfo = solendInfo.oracles.assets.find((ass) => ass.asset === symbol);
    if (!oracleInfo) {
        throw new Error(`Could not find oracle info for ${symbol}.`);
    }
    return Object.assign(Object.assign(Object.assign({}, tokenInfo), reserveInfo), oracleInfo);
}
exports.getReserveInfo = getReserveInfo;
exports.U64_MAX = "18446744073709551615";
exports.WAD = new bn_js_1.default(`1${"".padEnd(18, "0")}`);
class BNumber {
    constructor(significand, precision) {
        const stringSig = safeToString(significand);
        const isNeg = stringSig[0] === "-";
        const unsignedStringSig = stringSig.replace("-", "");
        if (!precision || unsignedStringSig.indexOf(".") !== -1) {
            this.significand = `${isNeg ? "-" : ""}${unsignedStringSig
                .split(".")
                .join("")}`;
            this.precision =
                unsignedStringSig.indexOf(".") === -1
                    ? 0
                    : unsignedStringSig.length - unsignedStringSig.indexOf(".") - 1;
        }
        else {
            this.significand = `${isNeg ? "-" : ""}${unsignedStringSig}`;
            this.precision = precision;
        }
    }
    isZero() {
        return new bn_js_1.default(this.significand).eq(new bn_js_1.default("0"));
    }
    isNan() {
        return this.precision < 0;
    }
    toString() {
        return this.significand;
    }
    toHuman() {
        return toHumanDec(this.significand, this.precision);
    }
    neg() {
        return neg(this);
    }
    isGreaterThanOrEqualTo(value) {
        const [paddedThis, paddedValue] = equalPadding(this, value);
        return new bn_js_1.default(paddedThis).gte(new bn_js_1.default(paddedValue));
    }
    isGreaterThan(value) {
        const [paddedThis, paddedValue] = equalPadding(this, value);
        return new bn_js_1.default(paddedThis).gt(new bn_js_1.default(paddedValue));
    }
    isEqualTo(value) {
        const [paddedThis, paddedValue] = equalPadding(this, value);
        return new bn_js_1.default(paddedThis).eq(new bn_js_1.default(paddedValue));
    }
    isLessThanOrEqualTo(value) {
        const [paddedThis, paddedValue] = equalPadding(this, value);
        return new bn_js_1.default(paddedThis).lte(new bn_js_1.default(paddedValue));
    }
    isLessThan(value) {
        const [paddedThis, paddedValue] = equalPadding(this, value);
        return new bn_js_1.default(paddedThis).lt(new bn_js_1.default(paddedValue));
    }
    add(addend) {
        return add(this, addend);
    }
    subtract(subtrahend) {
        return subtract(this, subtrahend);
    }
    multiply(multiplier) {
        return multiply(this, multiplier);
    }
    divideBy(divisor) {
        return divide(this, divisor);
    }
    max(value) {
        return max(this, value);
    }
    min(value) {
        return min(this, value);
    }
    fromWads() {
        return this.divideBy(exports.BWAD);
    }
    fromRays() {
        return this.divideBy(exports.BRAY);
    }
    fromWangs() {
        return this.divideBy(exports.BWANG);
    }
}
exports.BNumber = BNumber;
exports.BWAD = new BNumber("1".concat(Array(18 + 1).join("0")));
exports.BRAY = new BNumber("1".concat(Array(27 + 1).join("0")));
exports.BWANG = new BNumber("1".concat(Array(36 + 1).join("0")));
exports.BNaN = new BNumber("0", -1);
exports.BZero = new BNumber("0", 0);
// Returns token info from ASSETS config
function getTokenInfo(symbol) {
    const solendInfo = production_json_1.default;
    const tokenInfo = (0, lodash_1.find)(solendInfo.assets, { symbol });
    if (!tokenInfo) {
        throw new Error(`Could not find ${symbol} in ASSETS`);
    }
    return tokenInfo;
}
exports.getTokenInfo = getTokenInfo;
// Converts amount to human (rebase with decimals)
function toHuman(amount, symbol) {
    const decimals = getDecimals(symbol);
    return toHumanDec(amount, decimals);
}
exports.toHuman = toHuman;
function toBaseUnit(amount, symbol) {
    if (amount === exports.U64_MAX)
        return amount;
    const decimals = getDecimals(symbol);
    return toBaseUnitDec(amount, decimals);
}
exports.toBaseUnit = toBaseUnit;
function toHumanDec(amount, decimals) {
    const isNeg = amount[0] === "-";
    return `${isNeg ? "-" : ""}${toHumanDecUnsigned(amount.replace("-", ""), decimals)}`;
}
function toHumanDecUnsigned(amount, decimals) {
    let amountStr = amount.slice(amount.length - Math.min(decimals, amount.length));
    if (decimals > amount.length) {
        for (let i = 0; i < decimals - amount.length; i += 1) {
            amountStr = `0${amountStr}`;
        }
        amountStr = `0.${amountStr}`;
    }
    else {
        amountStr = `.${amountStr}`;
        for (let i = amount.length - decimals - 1; i >= 0; i -= 1) {
            amountStr = amount[i] + amountStr;
        }
        if (amountStr[0] === ".") {
            amountStr = `0${amountStr}`;
        }
    }
    amountStr = stripEnd(amountStr, "0");
    amountStr = stripEnd(amountStr, ".");
    return amountStr;
}
function toBaseUnitDec(amount, decimals) {
    const isNeg = amount[0] === "-";
    return `${isNeg ? "-" : ""}${toBaseUnitDecUnsigned(amount.replace("-", ""), decimals)}`;
}
// Converts to base unit amount
// e.g. 1.0 SOL => 1000000000 (lamports)
function toBaseUnitDecUnsigned(amount, decimals) {
    if (decimals < 0) {
        throw new Error(`Invalid decimal ${decimals}`);
    }
    if ((amount.match(/\./g) || []).length > 1) {
        throw new Error("Too many decimal points");
    }
    let decimalIndex = amount.indexOf(".");
    let precision;
    if (decimalIndex === -1) {
        precision = 0;
        decimalIndex = amount.length; // Pretend it's at the end
    }
    else {
        precision = amount.length - decimalIndex - 1;
    }
    if (precision === decimals) {
        return amount.slice(0, decimalIndex) + amount.slice(decimalIndex + 1);
    }
    if (precision < decimals) {
        const numTrailingZeros = decimals - precision;
        return (amount.slice(0, decimalIndex) +
            amount.slice(decimalIndex + 1) +
            "".padEnd(numTrailingZeros, "0"));
    }
    return (amount.slice(0, decimalIndex) +
        amount.slice(decimalIndex + 1, decimalIndex + decimals + 1));
}
function getDecimals(symbol) {
    const tokenInfo = getTokenInfo(symbol);
    return tokenInfo.decimals;
}
exports.getDecimals = getDecimals;
// Strips character c from end of string s
function stripEnd(s, c) {
    let i = s.length - 1;
    for (; i >= 0; i -= 1) {
        if (s[i] !== c) {
            break;
        }
    }
    return s.slice(0, i + 1);
}
function cTokenToToken(supplyAmount, totalLiquidityWads, mintSupplyWads, decimals) {
    if (new bn_js_1.default(mintSupplyWads) === new bn_js_1.default("0")) {
        return supplyAmount;
    }
    return toHumanDec(new bn_js_1.default(toBaseUnitDec(supplyAmount, decimals))
        .mul(new bn_js_1.default(totalLiquidityWads))
        .divRound(new bn_js_1.default(mintSupplyWads))
        .toString(), decimals);
}
exports.cTokenToToken = cTokenToToken;
function tokenToCToken(supplyAmount, totalLiquidityWads, mintSupplyWads, decimals) {
    if (new bn_js_1.default(mintSupplyWads) === new bn_js_1.default("0")) {
        return supplyAmount;
    }
    return toHumanDec(new bn_js_1.default(toBaseUnitDec(supplyAmount, decimals))
        .mul(new bn_js_1.default(mintSupplyWads))
        .divRound(new bn_js_1.default(totalLiquidityWads))
        .toString(), decimals);
}
exports.tokenToCToken = tokenToCToken;
function getBorrowedAmountWadsWithInterest(reserveCumulativeBorrowRateWads, obligationCumulativeBorrowRateWads, obligationBorrowAmount, decimals) {
    const reserveCumulativeBorrowRate = new bn_js_1.default(reserveCumulativeBorrowRateWads);
    const obligationCumulativeBorrowRate = new bn_js_1.default(obligationCumulativeBorrowRateWads);
    if (obligationCumulativeBorrowRate >= reserveCumulativeBorrowRate ||
        obligationBorrowAmount === "0") {
        return obligationBorrowAmount;
    }
    return toHumanDec(new bn_js_1.default(toBaseUnitDec(obligationBorrowAmount, decimals))
        .mul(reserveCumulativeBorrowRate)
        .div(obligationCumulativeBorrowRate)
        .toString(), decimals);
}
exports.getBorrowedAmountWadsWithInterest = getBorrowedAmountWadsWithInterest;
function concatZeros(value, numZeroes) {
    return value.concat(Array(numZeroes + 1).join("0"));
}
exports.concatZeros = concatZeros;
function add(addend1, addend2) {
    const [paddedAddend1, paddedAddend2] = equalPadding(addend1, addend2);
    const sum = new bn_js_1.default(paddedAddend1).add(new bn_js_1.default(paddedAddend2)).toString();
    return new BNumber(sum, Math.max(addend1.precision, addend2.precision));
}
exports.add = add;
function subtract(minuend1, minuend2) {
    const [paddedMinuend1, paddedMinuend2] = equalPadding(minuend1, minuend2);
    return new BNumber(new bn_js_1.default(paddedMinuend1).sub(new bn_js_1.default(paddedMinuend2)).toString(), Math.max(minuend1.precision, minuend2.precision));
}
exports.subtract = subtract;
function multiply(multiplicand, multiplier) {
    return new BNumber(new bn_js_1.default(multiplicand.toString())
        .mul(new bn_js_1.default(multiplier.toString()))
        .toString(), multiplicand.precision + multiplier.precision);
}
exports.multiply = multiply;
// We represent a fraction as a single number, precise always exactly to 18 decimal places and truncated past there
function divide(dividend, divisor) {
    if (new bn_js_1.default(divisor.significand).eq(new bn_js_1.default("0"))) {
        return exports.BNaN;
    }
    const [paddedDividend, paddedDivisor] = equalPadding(dividend, divisor);
    // pad the dividend further by 18 digits to get the required precision
    const precisionPaddedDividend = concatZeros(paddedDividend, 18);
    return new BNumber(new bn_js_1.default(precisionPaddedDividend).div(new bn_js_1.default(paddedDivisor)).toString(), 18);
}
exports.divide = divide;
function min(...args) {
    const maxPrecision = Math.max(...args.map((arg) => arg.precision));
    const paddedArgs = equalPadding(...args);
    return new BNumber(paddedArgs.reduce((a, b) => bn_js_1.default.min(new bn_js_1.default(a), new bn_js_1.default(b)).toString()), maxPrecision);
}
exports.min = min;
function max(...args) {
    const maxPrecision = Math.max(...args.map((arg) => arg.precision));
    const paddedArgs = equalPadding(...args);
    return new BNumber(paddedArgs.reduce((a, b) => bn_js_1.default.max(new bn_js_1.default(a), new bn_js_1.default(b)).toString()), maxPrecision);
}
exports.max = max;
function neg(val) {
    return new BNumber(new bn_js_1.default(val.significand).neg().toString(), val.precision);
}
exports.neg = neg;
function equalPadding(...args) {
    const maxPrecision = Math.max(...args.map((arg) => arg.precision));
    return args.map((arg) => concatZeros(arg.toString(), maxPrecision - arg.precision));
}
function safeToString(arg) {
    if (typeof arg === "string") {
        if (arg.length === 0) {
            return "";
        }
        return arg;
    }
    if (Math.abs(arg) < 1.0) {
        const e = parseInt(arg.toString().split("e-")[1]);
        if (e) {
            arg *= Math.pow(10, e - 1);
            arg = "0." + new Array(e).join("0") + arg.toString().substring(2);
        }
    }
    else {
        let e = parseInt(arg.toString().split("+")[1]);
        if (e > 20) {
            e -= 20;
            arg /= Math.pow(10, e);
            arg = arg + new Array(e + 1).join("0");
        }
    }
    return arg.toString();
}
exports.safeToString = safeToString;
