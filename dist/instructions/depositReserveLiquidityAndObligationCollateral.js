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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositReserveLiquidityAndObligationCollateralInstruction = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const Layout = __importStar(require("../utils/layout"));
const instruction_1 = require("./instruction");
const BufferLayout = require("buffer-layout");
/// Deposit liquidity into a reserve in exchange for collateral, and deposit the collateral as well.
const depositReserveLiquidityAndObligationCollateralInstruction = (liquidityAmount, sourceLiquidity, sourceCollateral, reserve, reserveLiquiditySupply, reserveCollateralMint, lendingMarket, lendingMarketAuthority, destinationCollateral, obligation, obligationOwner, pythOracle, switchboardFeedAddress, transferAuthority, solendProgramAddress) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("liquidityAmount"),
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.LendingInstruction.DepositReserveLiquidityAndObligationCollateral,
        liquidityAmount: new bn_js_1.default(liquidityAmount),
    }, data);
    const keys = [
        { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
        { pubkey: sourceCollateral, isSigner: false, isWritable: true },
        { pubkey: reserve, isSigner: false, isWritable: true },
        { pubkey: reserveLiquiditySupply, isSigner: false, isWritable: true },
        { pubkey: reserveCollateralMint, isSigner: false, isWritable: true },
        { pubkey: lendingMarket, isSigner: false, isWritable: true },
        { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
        { pubkey: destinationCollateral, isSigner: false, isWritable: true },
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: obligationOwner, isSigner: true, isWritable: false },
        { pubkey: pythOracle, isSigner: false, isWritable: false },
        { pubkey: switchboardFeedAddress, isSigner: false, isWritable: false },
        { pubkey: transferAuthority, isSigner: true, isWritable: false },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: solendProgramAddress,
        data,
    });
};
exports.depositReserveLiquidityAndObligationCollateralInstruction = depositReserveLiquidityAndObligationCollateralInstruction;
