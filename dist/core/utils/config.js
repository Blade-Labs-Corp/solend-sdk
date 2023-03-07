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
exports.fetchPoolMetadataFromChain = exports.fetchPoolMetadata = void 0;
const web3_js_1 = require("@solana/web3.js");
const index_1 = require("../../index");
const constants_1 = require("../constants");
const utils_1 = require("./utils");
function fetchPoolMetadata(connection, environment = "production", useApi, debug, customProgramId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (debug)
            console.log("fetchConfig");
        const programId = customProgramId != null ? customProgramId : (0, index_1.getProgramId)(environment);
        if (!useApi)
            return (0, exports.fetchPoolMetadataFromChain)(connection, programId, debug);
        try {
            const configResponse = yield fetch(`https://api.solend.fi/v1/markets/configs?scope=all&deployment=${environment === "mainnet-beta" ? "production" : environment}`);
            if (!configResponse.ok) {
                // fallback
                throw Error("Solend backend configs failed.");
            }
            const configData = yield configResponse.json();
            return configData.map((c) => ({
                name: (0, utils_1.titleCase)(c.name),
                owner: c.owner,
                address: c.address,
                authorityAddress: c.authorityAddress,
            }));
        }
        catch (e) {
            return (0, exports.fetchPoolMetadataFromChain)(connection, programId, debug);
        }
    });
}
exports.fetchPoolMetadata = fetchPoolMetadata;
const fetchPoolMetadataFromChain = (connection, programId, debug) => __awaiter(void 0, void 0, void 0, function* () {
    if (debug)
        console.log("fetchPoolsFromChain");
    const filters = [{ dataSize: index_1.LENDING_MARKET_SIZE }];
    const pools = yield connection.getProgramAccounts(programId, {
        commitment: connection.commitment,
        filters,
        encoding: "base64",
    });
    return pools
        .sort((a, _b) => a.account.owner.toBase58() === constants_1.SOLEND_ADDRESSES[0] ? 1 : -1)
        .map((pool) => {
        const [authorityAddress, _bumpSeed] = web3_js_1.PublicKey.findProgramAddressSync([pool.pubkey.toBytes()], programId);
        return {
            name: null,
            owner: pool.account.owner.toBase58(),
            authorityAddress: authorityAddress.toBase58(),
            address: pool.pubkey.toBase58(),
        };
    });
});
exports.fetchPoolMetadataFromChain = fetchPoolMetadataFromChain;
