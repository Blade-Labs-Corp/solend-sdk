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
exports.fetchWalletAssets = exports.formatWalletAssets = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const utils_1 = require("./utils");
function formatWalletAssets(rawWalletData, metadata) {
    const { userAssociatedTokenAccounts, wSolAddress, nativeSolBalance } = rawWalletData;
    const assets = userAssociatedTokenAccounts
        .map((parsedAccount) => {
        var _a;
        if (!parsedAccount)
            return null;
        const mintAddress = parsedAccount.mint.toBase58();
        const tokenMetadata = metadata[mintAddress];
        const decimals = (_a = tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.decimals) !== null && _a !== void 0 ? _a : 0;
        return {
            decimals,
            symbol: (tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.symbol) === "SOL" ? "wSOL" : tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.symbol,
            address: parsedAccount.address.toBase58(),
            amount: new bignumber_js_1.default(parsedAccount.amount.toString()).shiftedBy(-decimals),
            mintAddress: (tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.symbol) === "SOL" ? "wSOL" : mintAddress,
        };
    })
        .filter(Boolean);
    return assets.concat([
        {
            decimals: Math.log10(web3_js_1.LAMPORTS_PER_SOL),
            symbol: "SOL",
            address: wSolAddress,
            amount: nativeSolBalance,
            mintAddress: spl_token_1.NATIVE_MINT.toBase58(),
        },
    ]);
}
exports.formatWalletAssets = formatWalletAssets;
function fetchWalletAssets(uniqueAssets, publicKey, connection, debug) {
    return __awaiter(this, void 0, void 0, function* () {
        if (debug)
            console.log("fetchWalletAssets", uniqueAssets.length);
        const userTokenAssociatedAddresses = yield Promise.all(uniqueAssets.map((asset) => __awaiter(this, void 0, void 0, function* () {
            const userTokenAccount = yield (0, spl_token_1.getAssociatedTokenAddress)(new web3_js_1.PublicKey(asset), new web3_js_1.PublicKey(publicKey), true);
            return userTokenAccount;
        })));
        const userAssociatedTokenAccounts = yield (0, utils_1.getBatchMultipleAccountsInfo)(userTokenAssociatedAddresses, connection);
        const nativeSolBalance = yield connection.getBalance(new web3_js_1.PublicKey(publicKey));
        const wSolAddress = (yield (0, spl_token_1.getAssociatedTokenAddress)(spl_token_1.NATIVE_MINT, new web3_js_1.PublicKey(publicKey), true)).toBase58();
        return {
            userAssociatedTokenAccounts: userAssociatedTokenAccounts.map((account, index) => account
                ? (0, spl_token_1.unpackAccount)(userTokenAssociatedAddresses[index], account)
                : null),
            nativeSolBalance: new bignumber_js_1.default(nativeSolBalance).dividedBy(web3_js_1.LAMPORTS_PER_SOL),
            wSolAddress,
        };
    });
}
exports.fetchWalletAssets = fetchWalletAssets;
