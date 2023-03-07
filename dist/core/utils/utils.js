"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeExtremeRates = exports.createObligationAddress = exports.getBatchMultipleAccountsInfo = exports.titleCase = exports.formatAddress = void 0;
const web3_js_1 = require("@solana/web3.js");
const ADDRESS_PREFIX_SUFFIX_LENGTH = 6;
const formatAddress = (address, length) => {
    return `${address.slice(0, length !== null && length !== void 0 ? length : ADDRESS_PREFIX_SUFFIX_LENGTH)}...${address.slice(-(length !== null && length !== void 0 ? length : ADDRESS_PREFIX_SUFFIX_LENGTH))}`;
};
exports.formatAddress = formatAddress;
const titleCase = (name) => {
    return name.charAt(0).toUpperCase().concat(name.slice(1));
};
exports.titleCase = titleCase;
function getBatchMultipleAccountsInfo(addresses, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = addresses.map((add) => new web3_js_1.PublicKey(add));
        const res = keys.reduce((acc, _curr, i) => {
            if (!(i % 100)) {
                // if index is 0 or can be divided by the `size`...
                acc.push(keys.slice(i, i + 100)); // ..push a chunk of the original array to the accumulator
            }
            return acc;
        }, []);
        return (yield Promise.all(res.map((accountGroup) => connection.getMultipleAccountsInfo(accountGroup, "processed")))).flatMap((x) => x);
    });
}
exports.getBatchMultipleAccountsInfo = getBatchMultipleAccountsInfo;
function createObligationAddress(publicKey, marketAddress, programId) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield web3_js_1.PublicKey.createWithSeed(new web3_js_1.PublicKey(publicKey), marketAddress.slice(0, 32), new web3_js_1.PublicKey(programId))).toBase58();
    });
}
exports.createObligationAddress = createObligationAddress;
function computeExtremeRates(configRate) {
    const rate = 0.5;
    let cleanRate = configRate;
    if (configRate >= 2.47) {
        cleanRate = Number(configRate.toString().replace(".", ""));
    }
    switch (cleanRate) {
        case 251:
            return rate * 6;
        case 252:
            return rate * 7;
        case 253:
            return rate * 8;
        case 254:
            return rate * 10;
        case 255:
            return rate * 12;
        case 250:
            return rate * 20;
        case 249:
            return rate * 30;
        case 248:
            return rate * 40;
        case 247:
            return rate * 50;
        default:
            return cleanRate;
    }
}
exports.computeExtremeRates = computeExtremeRates;
