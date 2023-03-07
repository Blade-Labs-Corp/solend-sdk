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
exports.generateCustomEnviromentConfig = void 0;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
// TODO: Maybe have some proper schema-based decoding in place instead of slicing buffers up manually
const reserveOffsets = {
    marketAddr: 10,
    tokenMintAddress: 42,
    liquidityAddress: 75,
    pythAddress: 107,
    switchboardAddress: 139,
    collateralMintAddress: 227,
    collateralSupplyAddress: 267,
    depositLimit: 323,
    borrowLimit: 331,
    liquidityFeeReceiverAddress: 339
};
function generateCustomEnviromentConfig(connection, marketName, marketDescription, reserveAccountData) {
    return __awaiter(this, void 0, void 0, function* () {
        let { owner: lendingProgram, data } = (yield connection.getAccountInfo(reserveAccountData[0].reserve));
        const lendingMarketAcc = new web3_js_1.PublicKey(data.subarray(10, 10 + 32));
        data = (yield connection.getAccountInfo(lendingMarketAcc)).data;
        let i = 0; // marketVersion
        const marketAuthBumpSeed = data[i += 1]; // marketBumpSeed
        i += 32; // marketOwner
        i += 32; // quoteCurrencyRaw
        i += 32; // marketTokenProgramId
        const pythProgramId = new web3_js_1.PublicKey(data.subarray(i, i += 32));
        const switchboardProgramId = new web3_js_1.PublicKey(data.subarray(i, i += 32));
        const marketAuthority = yield web3_js_1.PublicKey.createProgramAddress([lendingMarketAcc.toBuffer(), Buffer.from([marketAuthBumpSeed])], lendingProgram);
        const marketConfig = {
            name: marketName,
            isPrimary: false,
            description: marketDescription,
            creator: "nu11111111111111111111111111111111111111111",
            address: lendingMarketAcc.toBase58(),
            hidden: false,
            authorityAddress: marketAuthority.toBase58(),
            reserves: []
        };
        for (i = 0; i < reserveAccountData.length; i += 1) {
            const reserveAccData = reserveAccountData[i];
            const { data: reserveData } = (yield connection.getAccountInfo(reserveAccData.reserve));
            marketConfig.reserves.push({
                liquidityToken: {
                    mint: bs58_1.default.encode(reserveData.subarray(reserveOffsets.tokenMintAddress, reserveOffsets.tokenMintAddress + 32)),
                    name: reserveAccData.name,
                    symbol: reserveAccData.symbol,
                    decimals: reserveAccData.decimals,
                    // Not important for what we're using a custom env for
                    coingeckoID: "",
                    logo: "",
                    // No idea why this is defined as a number when the API returns a string
                    volume24h: 1
                },
                address: reserveAccData.reserve.toBase58(),
                pythOracle: bs58_1.default.encode(reserveData.subarray(reserveOffsets.pythAddress, reserveOffsets.pythAddress + 32)),
                switchboardOracle: bs58_1.default.encode(reserveData.subarray(reserveOffsets.switchboardAddress, reserveOffsets.switchboardAddress + 32)),
                collateralMintAddress: bs58_1.default.encode(reserveData.subarray(reserveOffsets.collateralMintAddress, reserveOffsets.collateralMintAddress + 32)),
                collateralSupplyAddress: bs58_1.default.encode(reserveData.subarray(reserveOffsets.collateralSupplyAddress, reserveOffsets.collateralSupplyAddress + 32)),
                liquidityAddress: bs58_1.default.encode(reserveData.subarray(reserveOffsets.liquidityAddress, reserveOffsets.liquidityAddress + 32)),
                liquidityFeeReceiverAddress: bs58_1.default.encode(reserveData.subarray(reserveOffsets.liquidityFeeReceiverAddress, reserveOffsets.liquidityFeeReceiverAddress + 32)),
                // No idea why these are numbers when the API returns strings
                userBorrowCap: Number(reserveData.readBigUInt64LE(reserveOffsets.borrowLimit)),
                userSupplyCap: Number(reserveData.readBigUInt64LE(reserveOffsets.depositLimit))
            });
        }
        return {
            pythProgramID: pythProgramId.toBase58(),
            switchboardProgramID: switchboardProgramId.toBase58(),
            programID: lendingProgram.toBase58(),
            marketConfigs: [marketConfig]
        };
    });
}
exports.generateCustomEnviromentConfig = generateCustomEnviromentConfig;
;
