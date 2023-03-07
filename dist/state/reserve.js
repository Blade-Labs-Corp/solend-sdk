"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserveToString = exports.parseReserve = exports.isReserve = exports.RESERVE_SIZE = exports.ReserveLayout = exports.ReserveConfigLayout = void 0;
const buffer_1 = require("buffer");
const Layout = __importStar(require("../utils/layout"));
const lastUpdate_1 = require("./lastUpdate");
const BufferLayout = require("buffer-layout");
exports.ReserveConfigLayout = BufferLayout.struct([
    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
    BufferLayout.struct([
        Layout.uint64("borrowFeeWad"),
        Layout.uint64("flashLoanFeeWad"),
        BufferLayout.u8("hostFeePercentage"),
    ], "fees"),
    Layout.uint64("depositLimit"),
    Layout.uint64("borrowLimit"),
    Layout.publicKey("feeReceiver"),
    BufferLayout.u8("protocolLiquidationFee"),
    BufferLayout.u8("protocolTakeRate"),
], "config");
exports.ReserveLayout = BufferLayout.struct([
    BufferLayout.u8("version"),
    lastUpdate_1.LastUpdateLayout,
    Layout.publicKey("lendingMarket"),
    Layout.publicKey("liquidityMintPubkey"),
    BufferLayout.u8("liquidityMintDecimals"),
    Layout.publicKey("liquiditySupplyPubkey"),
    // @FIXME: oracle option
    // TODO: replace u32 option with generic equivalent
    // BufferLayout.u32('oracleOption'),
    Layout.publicKey("liquidityPythOracle"),
    Layout.publicKey("liquiditySwitchboardOracle"),
    Layout.uint64("liquidityAvailableAmount"),
    Layout.uint128("liquidityBorrowedAmountWads"),
    Layout.uint128("liquidityCumulativeBorrowRateWads"),
    Layout.uint128("liquidityMarketPrice"),
    Layout.publicKey("collateralMintPubkey"),
    Layout.uint64("collateralMintTotalSupply"),
    Layout.publicKey("collateralSupplyPubkey"),
    BufferLayout.u8("optimalUtilizationRate"),
    BufferLayout.u8("loanToValueRatio"),
    BufferLayout.u8("liquidationBonus"),
    BufferLayout.u8("liquidationThreshold"),
    BufferLayout.u8("minBorrowRate"),
    BufferLayout.u8("optimalBorrowRate"),
    BufferLayout.u8("maxBorrowRate"),
    Layout.uint64("borrowFeeWad"),
    Layout.uint64("flashLoanFeeWad"),
    BufferLayout.u8("hostFeePercentage"),
    Layout.uint64("depositLimit"),
    Layout.uint64("borrowLimit"),
    Layout.publicKey("feeReceiver"),
    BufferLayout.u8("protocolLiquidationFee"),
    BufferLayout.u8("protocolTakeRate"),
    Layout.uint128("accumulatedProtocolFeesWads"),
    BufferLayout.blob(230, "padding"),
]);
function decodeReserve(buffer) {
    const reserve = exports.ReserveLayout.decode(buffer);
    return {
        version: reserve.version,
        lastUpdate: reserve.lastUpdate,
        lendingMarket: reserve.lendingMarket,
        liquidity: {
            mintPubkey: reserve.liquidityMintPubkey,
            mintDecimals: reserve.liquidityMintDecimals,
            supplyPubkey: reserve.liquiditySupplyPubkey,
            // @FIXME: oracle option
            oracleOption: reserve.liquidityOracleOption,
            pythOracle: reserve.liquidityPythOracle,
            switchboardOracle: reserve.liquiditySwitchboardOracle,
            availableAmount: reserve.liquidityAvailableAmount,
            borrowedAmountWads: reserve.liquidityBorrowedAmountWads,
            cumulativeBorrowRateWads: reserve.liquidityCumulativeBorrowRateWads,
            marketPrice: reserve.liquidityMarketPrice,
            accumulatedProtocolFeesWads: reserve.accumulatedProtocolFeesWads,
        },
        collateral: {
            mintPubkey: reserve.collateralMintPubkey,
            mintTotalSupply: reserve.collateralMintTotalSupply,
            supplyPubkey: reserve.collateralSupplyPubkey,
        },
        config: {
            optimalUtilizationRate: reserve.optimalUtilizationRate,
            loanToValueRatio: reserve.loanToValueRatio,
            liquidationBonus: reserve.liquidationBonus,
            liquidationThreshold: reserve.liquidationThreshold,
            minBorrowRate: reserve.minBorrowRate,
            optimalBorrowRate: reserve.optimalBorrowRate,
            maxBorrowRate: reserve.maxBorrowRate,
            fees: {
                borrowFeeWad: reserve.borrowFeeWad,
                flashLoanFeeWad: reserve.flashLoanFeeWad,
                hostFeePercentage: reserve.hostFeePercentage,
            },
            depositLimit: reserve.depositLimit,
            borrowLimit: reserve.borrowLimit,
            feeReceiver: reserve.feeReceiver,
            protocolLiquidationFee: reserve.protocolLiquidationFee,
            protocolTakeRate: reserve.protocolTakeRate,
        },
    };
}
exports.RESERVE_SIZE = exports.ReserveLayout.span;
const isReserve = (info) => info.data.length === exports.RESERVE_SIZE;
exports.isReserve = isReserve;
const parseReserve = (pubkey, info) => {
    const { data } = info;
    const buffer = buffer_1.Buffer.from(data);
    const reserve = decodeReserve(buffer);
    if (reserve.lastUpdate.slot.isZero()) {
        return null;
    }
    const details = {
        pubkey,
        account: Object.assign({}, info),
        info: reserve,
    };
    return details;
};
exports.parseReserve = parseReserve;
function reserveToString(reserve) {
    return JSON.stringify(reserve, (key, value) => {
        // Skip padding
        if (key === "padding") {
            return null;
        }
        switch (value.constructor.name) {
            case "PublicKey":
                return value.toBase58();
            case "BN":
                return value.toString();
            default:
                return value;
        }
    }, 2);
}
exports.reserveToString = reserveToString;