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
exports.fetchPrices = void 0;
const client_1 = require("@pythnetwork/client");
const utils_1 = require("./utils");
const SBV2_MAINNET = "SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f";
function fetchPrices(parsedReserves, connection, switchboardProgram, debug) {
    return __awaiter(this, void 0, void 0, function* () {
        if (debug)
            console.log("fetchPrices");
        const oracles = parsedReserves
            .map((reserve) => reserve.info.liquidity.pythOracle)
            .concat(parsedReserves.map((reserve) => reserve.info.liquidity.switchboardOracle));
        const priceAccounts = yield (0, utils_1.getBatchMultipleAccountsInfo)(oracles, connection);
        return parsedReserves.reduce((acc, reserve, i) => {
            var _a;
            const pythOracleData = priceAccounts[i];
            const switchboardOracleData = priceAccounts[parsedReserves.length + i];
            let priceData;
            if (pythOracleData) {
                const { price, previousPrice } = (0, client_1.parsePriceData)(pythOracleData.data);
                if (price || previousPrice) {
                    // use latest price if available otherwise fallback to previoius
                    priceData = price || previousPrice;
                }
            }
            // Only attempt to fetch from switchboard if not already available from pyth
            if (!priceData) {
                const rawSb = switchboardOracleData;
                const switchboardData = (_a = switchboardOracleData === null || switchboardOracleData === void 0 ? void 0 : switchboardOracleData.data) === null || _a === void 0 ? void 0 : _a.slice(1);
                if (rawSb && switchboardData) {
                    const owner = rawSb.owner.toString();
                    if (owner === SBV2_MAINNET) {
                        const result = switchboardProgram.decodeLatestAggregatorValue(rawSb);
                        priceData = result === null || result === void 0 ? void 0 : result.toNumber();
                    }
                }
            }
            return Object.assign(Object.assign({}, acc), { [reserve.pubkey.toBase58()]: priceData });
        }, {});
    });
}
exports.fetchPrices = fetchPrices;
