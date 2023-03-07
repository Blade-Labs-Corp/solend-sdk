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
exports.fetchTokensInfo = void 0;
const utl_sdk_1 = require("@solflare-wallet/utl-sdk");
const web3_js_1 = require("@solana/web3.js");
const fetchTokensInfo = (mints, connection, debug) => __awaiter(void 0, void 0, void 0, function* () {
    if (debug)
        console.log("getTokensInfo");
    const defaultConfig = new utl_sdk_1.Client();
    const utl = new utl_sdk_1.Client(Object.assign(Object.assign({}, defaultConfig.config), { connection }));
    const tokens = yield utl.fetchMints(mints.map((mint) => new web3_js_1.PublicKey(mint)));
    return Object.fromEntries(tokens
        .map((token) => {
        var _a;
        return token
            ? [
                token.address,
                {
                    symbol: token.symbol,
                    logoUri: token.logoURI,
                    decimals: (_a = token.decimals) !== null && _a !== void 0 ? _a : 0,
                },
            ]
            : [];
    })
        .filter((x) => x.length));
});
exports.fetchTokensInfo = fetchTokensInfo;
