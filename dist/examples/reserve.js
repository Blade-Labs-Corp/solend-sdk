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
exports.calculateMarinadeData = exports.calculateRewardApy = exports.calculateSupplyAPY = exports.loadTokensOracleData = exports.calculateBorrowAPY = exports.calculateUtilizationRatio = void 0;
const web3_js_1 = require("@solana/web3.js");
const client_1 = require("@pythnetwork/client");
const common_1 = require("./common");
const reserve_1 = require("../state/reserve");
const SOLEND_API_HOST = "https://api.solend.fi";
const loadReserve = (symbol, rpcEndpoint = "https://api.mainnet-beta.solana.com") => __awaiter(void 0, void 0, void 0, function* () {
    const connection = new web3_js_1.Connection(rpcEndpoint, {
        commitment: "finalized",
    });
    const reservePublickKey = new web3_js_1.PublicKey((0, common_1.getReserveInfo)(symbol).address);
    const reserveAccountInfo = yield connection.getAccountInfo(reservePublickKey);
    if (!reserveAccountInfo) {
        throw Error(`Account for ${symbol} not found.`);
    }
    const parsedReserve = (0, reserve_1.parseReserve)(reservePublickKey, reserveAccountInfo);
    if (!parsedReserve) {
        throw Error("Could not parse reserve.");
    }
    return parsedReserve.info;
});
const calculateUtilizationRatio = (reserve) => {
    const borrowedAmount = new common_1.BNumber(reserve.liquidity.borrowedAmountWads.toString()).fromWads();
    const availableAmount = new common_1.BNumber(reserve.liquidity.availableAmount.toString());
    const currentUtilization = borrowedAmount.divideBy(availableAmount.add(borrowedAmount));
    return currentUtilization;
};
exports.calculateUtilizationRatio = calculateUtilizationRatio;
const calculateBorrowAPY = (reserve) => {
    const currentUtilization = (0, exports.calculateUtilizationRatio)(reserve);
    const optimalUtilization = new common_1.BNumber(reserve.config.optimalUtilizationRate.toString()).divideBy(new common_1.BNumber(100));
    const optimalBorrowRate = new common_1.BNumber(reserve.config.optimalBorrowRate).divideBy(new common_1.BNumber(100));
    let borrowAPY;
    if (optimalUtilization.isEqualTo(new common_1.BNumber(1)) ||
        currentUtilization.isLessThan(optimalUtilization)) {
        const normalizedFactor = currentUtilization.divideBy(optimalUtilization);
        const minBorrowRate = new common_1.BNumber(reserve.config.minBorrowRate).divideBy(new common_1.BNumber(100));
        borrowAPY = normalizedFactor
            .multiply(optimalBorrowRate.subtract(minBorrowRate))
            .add(minBorrowRate);
    }
    else {
        const normalizedFactor = currentUtilization
            .subtract(optimalUtilization)
            .divideBy(new common_1.BNumber(1).subtract(optimalUtilization));
        const maxBorrowRate = new common_1.BNumber(reserve.config.maxBorrowRate).divideBy(new common_1.BNumber(100));
        borrowAPY = normalizedFactor
            .multiply(maxBorrowRate.subtract(optimalBorrowRate))
            .add(optimalBorrowRate);
    }
    return borrowAPY;
};
exports.calculateBorrowAPY = calculateBorrowAPY;
function loadTokensOracleData(priceAddresses, rpcEndpoint = "https://api.mainnet-beta.solana.com") {
    return __awaiter(this, void 0, void 0, function* () {
        const addressesKeys = priceAddresses.map((add) => new web3_js_1.PublicKey(add));
        const connection = new web3_js_1.Connection(rpcEndpoint, {
            commitment: "finalized",
        });
        const unparsedOracleAccounts = yield connection.getMultipleAccountsInfo(addressesKeys, "processed");
        return unparsedOracleAccounts.map((acc) => {
            if (!acc)
                throw Error(`Unable to fetch prices from oracle.`);
            const priceData = (0, client_1.parsePriceData)(acc.data);
            if (!(priceData === null || priceData === void 0 ? void 0 : priceData.price))
                throw Error(`Unable to fetch prices from oracle.`);
            return priceData.price;
        });
    });
}
exports.loadTokensOracleData = loadTokensOracleData;
const calculateSupplyAPY = (reserve) => {
    const currentUtilization = (0, exports.calculateUtilizationRatio)(reserve);
    const borrowAPY = (0, exports.calculateBorrowAPY)(reserve);
    return currentUtilization.multiply(borrowAPY);
};
exports.calculateSupplyAPY = calculateSupplyAPY;
function getApyFromRewardRate(rewardRate, poolSize, price) {
    return new common_1.BNumber(rewardRate)
        .multiply(new common_1.BNumber(price))
        .divideBy(new common_1.BNumber(poolSize))
        .fromWangs();
}
function getLatestRewardRate(rewardRates, slot) {
    return rewardRates
        .filter((rr) => slot >= rr.beginningSlot)
        .reduce((v1, v2) => (v1.beginningSlot > v2.beginningSlot ? v1 : v2), {
        beginningSlot: 0,
        rewardRate: "0",
    });
}
function loadReward() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield (yield fetch(`${SOLEND_API_HOST}/liquidity-mining/reward-stats`)).json());
    });
}
function loadExternalReward() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield (yield fetch(`${SOLEND_API_HOST}/liquidity-mining/external-reward-stats`)).json());
    });
}
const calculateRewardApy = (mintAddress, price, side, slot, poolAssetPrice, poolAssetDecimals, data) => {
    const poolStat = data[mintAddress][side];
    const rewardRate = getLatestRewardRate(poolStat.rewardRates, slot);
    return getApyFromRewardRate(rewardRate.rewardRate, new common_1.BNumber(poolStat.totalBalance, poolAssetDecimals)
        .multiply(poolAssetPrice)
        .toHuman(), price);
};
exports.calculateRewardApy = calculateRewardApy;
const calculateMarinadeData = (rpcEndpoint = "https://api.mainnet-beta.solana.com") => __awaiter(void 0, void 0, void 0, function* () {
    const connection = new web3_js_1.Connection(rpcEndpoint, {
        commitment: "finalized",
    });
    const priceResponse = (yield (yield fetch("https://api.coingecko.com/api/v3/simple/price?ids=solend,marinade&vs_currencies=usd")).json());
    const reserveInfo = (0, common_1.getReserveInfo)("mSOL");
    const solendPrice = priceResponse.solend.usd;
    const marinadePrice = priceResponse.marinade.usd;
    const mostRecentSlot = yield connection.getSlot("finalized");
    const mintAddress = (0, common_1.getTokenInfo)("mSOL").mintAddress;
    const [reserve, reward, externalReward] = yield Promise.all([
        loadReserve("mSOL"),
        loadReward(),
        loadExternalReward(),
    ]);
    const mSOLPrice = new common_1.BNumber(reserve.liquidity.marketPrice.toString(), 18);
    const rewardApy = (0, exports.calculateRewardApy)(mintAddress, solendPrice, "supply", mostRecentSlot, mSOLPrice, reserveInfo.decimals, reward);
    const externalApy = (0, exports.calculateRewardApy)(mintAddress, marinadePrice, "supply", mostRecentSlot, mSOLPrice, reserveInfo.decimals, externalReward);
    const apy = (0, exports.calculateSupplyAPY)(reserve);
    return {
        tvl: new common_1.BNumber(reserve.liquidity.availableAmount.toString(), reserveInfo.decimals)
            .add(new common_1.BNumber(reserve.liquidity.borrowedAmountWads.toString(), 18 + reserveInfo.decimals))
            .multiply(mSOLPrice)
            .toHuman(),
        totalApy: apy.add(rewardApy).add(externalApy).toHuman(),
        dailySlndEmission: new common_1.BNumber(getLatestRewardRate(reward[mintAddress].supply.rewardRates, mostRecentSlot).rewardRate)
            .divideBy(new common_1.BNumber(365))
            .fromWangs()
            .toHuman(),
        dailyMndeEmission: new common_1.BNumber(getLatestRewardRate(externalReward[mintAddress].supply.rewardRates, mostRecentSlot).rewardRate)
            .divideBy(new common_1.BNumber(365))
            .fromWangs()
            .toHuman(),
    };
});
exports.calculateMarinadeData = calculateMarinadeData;
exports.default = loadReserve;
