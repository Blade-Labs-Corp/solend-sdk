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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchObligationsByAddress = exports.fetchObligationByAddress = exports.formatObligation = void 0;
const web3_js_1 = require("@solana/web3.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const state_1 = require("../../state");
const utils_1 = require("./utils");
function formatObligation(obligation, pool) {
    const poolAddress = obligation.info.lendingMarket.toBase58();
    const deposits = obligation.info.deposits
        .filter((d) => d.depositedAmount.toString() !== "0")
        .map((d) => {
        const reserveAddress = d.depositReserve.toBase58();
        const reserve = pool.reserves.find((r) => r.address === reserveAddress);
        if (!reserve)
            throw Error("Deposit in obligation does not exist in the pool");
        const amount = new bignumber_js_1.default(d.depositedAmount.toString())
            .shiftedBy(-reserve.decimals)
            .times(reserve.cTokenExchangeRate);
        const amountUsd = amount.times(reserve.price);
        return {
            liquidationThreshold: reserve.liquidationThreshold,
            loanToValueRatio: reserve.loanToValueRatio,
            symbol: reserve.symbol,
            price: reserve.price,
            reserveAddress,
            amount,
            amountUsd,
        };
    });
    const borrows = obligation.info.borrows
        .filter((b) => b.borrowedAmountWads.toString() !== "0")
        .map((b) => {
        const reserveAddress = b.borrowReserve.toBase58();
        const reserve = pool.reserves.find((r) => r.address === reserveAddress);
        if (!reserve)
            throw Error("Borrow in obligation does not exist in the pool");
        const amount = new bignumber_js_1.default(b.borrowedAmountWads.toString())
            .shiftedBy(-18 - reserve.decimals)
            .times(reserve.cumulativeBorrowRate)
            .dividedBy(new bignumber_js_1.default(b.cumulativeBorrowRateWads.toString()).shiftedBy(-18));
        const amountUsd = amount.times(reserve.price);
        return {
            liquidationThreshold: reserve.liquidationThreshold,
            loanToValueRatio: reserve.loanToValueRatio,
            symbol: reserve.symbol,
            price: reserve.price,
            reserveAddress,
            amount,
            amountUsd,
        };
    });
    const totalSupplyValue = deposits.reduce((acc, d) => acc.plus(d.amountUsd), new bignumber_js_1.default(0));
    const totalBorrowValue = borrows.reduce((acc, b) => acc.plus(b.amountUsd), new bignumber_js_1.default(0));
    const borrowLimit = deposits.reduce((acc, d) => d.amountUsd.times(d.loanToValueRatio).plus(acc), (0, bignumber_js_1.default)(0));
    const liquidationThreshold = deposits.reduce((acc, d) => d.amountUsd.times(d.liquidationThreshold).plus(acc), (0, bignumber_js_1.default)(0));
    const netAccountValue = totalSupplyValue.minus(totalBorrowValue);
    const liquidationThresholdFactor = totalSupplyValue.isZero()
        ? new bignumber_js_1.default(0)
        : liquidationThreshold.dividedBy(totalSupplyValue);
    const borrowLimitFactor = totalSupplyValue.isZero()
        ? new bignumber_js_1.default(0)
        : borrowLimit.dividedBy(totalSupplyValue);
    const borrowUtilization = borrowLimit.isZero()
        ? new bignumber_js_1.default(0)
        : totalBorrowValue.dividedBy(borrowLimit);
    const isBorrowLimitReached = borrowUtilization.isGreaterThanOrEqualTo(new bignumber_js_1.default("1"));
    const borrowOverSupply = totalSupplyValue.isZero()
        ? new bignumber_js_1.default(0)
        : totalBorrowValue.dividedBy(totalSupplyValue);
    const borrowLimitOverSupply = totalSupplyValue.isZero()
        ? new bignumber_js_1.default(0)
        : borrowLimit.dividedBy(totalSupplyValue);
    const positions = obligation.info.deposits.filter((d) => !d.depositedAmount.isZero()).length +
        obligation.info.borrows.filter((b) => !b.borrowedAmountWads.isZero())
            .length;
    return {
        address: obligation.pubkey.toBase58(),
        positions,
        deposits,
        borrows,
        poolAddress,
        totalSupplyValue,
        totalBorrowValue,
        borrowLimit,
        liquidationThreshold,
        netAccountValue,
        liquidationThresholdFactor,
        borrowLimitFactor,
        borrowUtilization,
        isBorrowLimitReached,
        borrowOverSupply,
        borrowLimitOverSupply,
    };
}
exports.formatObligation = formatObligation;
function fetchObligationByAddress(obligationAddress, connection, debug) {
    return __awaiter(this, void 0, void 0, function* () {
        if (debug)
            console.log("fetchObligationByAddress");
        const rawObligationData = yield connection.getAccountInfo(new web3_js_1.PublicKey(obligationAddress));
        if (!rawObligationData) {
            return null;
        }
        const parsedObligation = (0, state_1.parseObligation)(new web3_js_1.PublicKey(obligationAddress), rawObligationData);
        if (!parsedObligation) {
            return null;
        }
        return parsedObligation;
    });
}
exports.fetchObligationByAddress = fetchObligationByAddress;
function fetchObligationsByAddress(obligationAddresses, connection, debug) {
    return __awaiter(this, void 0, void 0, function* () {
        if (debug)
            console.log("fetchObligationsByAddress", obligationAddresses.length);
        const rawObligations = yield (0, utils_1.getBatchMultipleAccountsInfo)(obligationAddresses, connection);
        const parsedObligations = rawObligations
            .map((obligation, index) => obligation
            ? (0, state_1.parseObligation)(new web3_js_1.PublicKey(obligationAddresses[index]), obligation)
            : null)
            .filter(Boolean);
        return parsedObligations;
    });
}
exports.fetchObligationsByAddress = fetchObligationsByAddress;
