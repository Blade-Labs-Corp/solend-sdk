"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeExtremeRates = exports.calculateBorrowInterest = exports.calculateSupplyInterest = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const constants_1 = require("../constants");
const calculateSupplyAPR = (reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
    const borrowAPR = calculateBorrowAPR(reserve);
    const protocolTakePercentage = (0, bignumber_js_1.default)(1).minus(reserve.config.protocolTakeRate / 100);
    return currentUtilization.times(borrowAPR).times(protocolTakePercentage);
};
const calculateUtilizationRatio = (reserve) => {
    const borrowedAmount = new bignumber_js_1.default(reserve.liquidity.borrowedAmountWads.toString()).shiftedBy(-18);
    const totalSupply = borrowedAmount.plus(reserve.liquidity.availableAmount.toString());
    const currentUtilization = borrowedAmount.dividedBy(totalSupply);
    return currentUtilization;
};
const calculateBorrowAPR = (reserve) => {
    const currentUtilization = calculateUtilizationRatio(reserve);
    const optimalUtilization = new bignumber_js_1.default(reserve.config.optimalUtilizationRate / 100);
    let borrowAPR;
    if (optimalUtilization.isEqualTo(1) ||
        currentUtilization.isLessThan(optimalUtilization)) {
        const normalizedFactor = currentUtilization.dividedBy(optimalUtilization);
        const optimalBorrowRate = new bignumber_js_1.default(reserve.config.optimalBorrowRate / 100);
        const minBorrowRate = new bignumber_js_1.default(reserve.config.minBorrowRate / 100);
        borrowAPR = normalizedFactor
            .times(optimalBorrowRate.minus(minBorrowRate))
            .plus(minBorrowRate);
    }
    else {
        if (reserve.config.optimalBorrowRate === reserve.config.maxBorrowRate) {
            return new bignumber_js_1.default(computeExtremeRates(reserve.config.maxBorrowRate / 100));
        }
        const normalizedFactor = currentUtilization
            .minus(optimalUtilization)
            .dividedBy(new bignumber_js_1.default(1).minus(optimalUtilization));
        const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
        const maxBorrowRate = reserve.config.maxBorrowRate / 100;
        borrowAPR = normalizedFactor
            .times(maxBorrowRate - optimalBorrowRate)
            .plus(optimalBorrowRate);
    }
    return borrowAPR;
};
const calculateSupplyAPY = (reserve) => {
    const apr = calculateSupplyAPR(reserve);
    const apy = Math.pow(new bignumber_js_1.default(1)
        .plus(new bignumber_js_1.default(apr).dividedBy(constants_1.SLOTS_PER_YEAR))
        .toNumber(), constants_1.SLOTS_PER_YEAR) -
        1;
    return new bignumber_js_1.default(apy);
};
const calculateBorrowAPY = (reserve) => {
    const apr = calculateBorrowAPR(reserve);
    const apy = Math.pow(new bignumber_js_1.default(1)
        .plus(new bignumber_js_1.default(apr).dividedBy(constants_1.SLOTS_PER_YEAR))
        .toNumber(), constants_1.SLOTS_PER_YEAR) -
        1;
    return new bignumber_js_1.default(apy);
};
const calculateSupplyInterest = (reserve, showApy) => showApy ? calculateSupplyAPY(reserve) : calculateSupplyAPR(reserve);
exports.calculateSupplyInterest = calculateSupplyInterest;
const calculateBorrowInterest = (reserve, showApy) => showApy ? calculateBorrowAPY(reserve) : calculateBorrowAPR(reserve);
exports.calculateBorrowInterest = calculateBorrowInterest;
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
