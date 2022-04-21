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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolendObligation = exports.SolendReserve = exports.SolendMarket = void 0;
/* eslint-disable max-classes-per-file */
const web3_js_1 = require("@solana/web3.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const reserve_1 = require("../state/reserve");
const obligation_1 = require("../state/obligation");
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("./constants");
const axios_1 = __importDefault(require("axios"));
const API_ENDPOINT = "https://api.solend.fi";
function formatReserveConfig(config, marketAddress) {
    var _a;
    const market = marketAddress
        ? config.markets.find((mar) => mar.address === marketAddress)
        : (_a = config.markets.find((mar) => mar.isPrimary)) !== null && _a !== void 0 ? _a : config.markets[0];
    if (!market) {
        throw Error("No markets found.");
    }
    const hydratedReserves = market.reserves.map((res) => {
        const assetData = config.assets.find((asset) => asset.symbol === res.asset);
        if (!assetData) {
            throw new Error(`Could not find asset ${res.asset} in config`);
        }
        const oracleData = config.oracles.assets.find((asset) => asset.asset === res.asset);
        if (!oracleData) {
            throw new Error(`Could not find oracle data for ${res.asset} in config`);
        }
        const { asset: _asset } = oracleData, trimmedoracleData = __rest(oracleData, ["asset"]);
        return Object.assign(Object.assign(Object.assign({}, res), assetData), trimmedoracleData);
    });
    return Object.assign(Object.assign({}, market), { pythProgramID: config.oracles.pythProgramID, switchboardProgramID: config.oracles.switchboardProgramID, programID: config.programID, reserves: hydratedReserves });
}
class SolendMarket {
    constructor(connection) {
        this.connection = connection;
        this.reserves = [];
        this.rewardsData = null;
        this.config = null;
    }
    static initialize(connection, environment = "production", marketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const market = new SolendMarket(connection);
            const rawConfig = typeof environment == "string" ? (yield (yield axios_1.default.get(`${API_ENDPOINT}/v1/config?deployment=${environment}`)).data) : environment;
            market.config = formatReserveConfig(rawConfig, marketAddress);
            market.reserves = market.config.reserves.map((res) => new SolendReserve(res, market, connection));
            return market;
        });
    }
    fetchObligationByWallet(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const { config, reserves } = this;
            if (!config) {
                throw Error("Market must be initialized to call fetchObligationByWallet.");
            }
            const obligationAddress = yield web3_js_1.PublicKey.createWithSeed(publicKey, config.address.slice(0, 32), new web3_js_1.PublicKey(config === null || config === void 0 ? void 0 : config.programID));
            const rawObligationData = yield this.connection.getAccountInfo(obligationAddress);
            if (!rawObligationData) {
                return null;
            }
            const parsedObligation = (0, obligation_1.parseObligation)(web3_js_1.PublicKey.default, rawObligationData);
            if (!parsedObligation) {
                throw Error("Could not parse obligation.");
            }
            if (!reserves.every((reserve) => reserve.stats)) {
                yield this.loadReserves();
            }
            const obligationInfo = parsedObligation.info;
            return new SolendObligation(publicKey, obligationAddress, obligationInfo, reserves);
        });
    }
    loadAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [this.loadReserves(), this.loadRewards()];
            yield Promise.all(promises);
        });
    }
    loadLMRewardData() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = (yield axios_1.default.get(`${API_ENDPOINT}/liquidity-mining/reward-stats`)).data;
            return data;
        });
    }
    loadExternalRewardData() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = (yield axios_1.default.get(`${API_ENDPOINT}/liquidity-mining/external-reward-stats`)).data;
            return data;
        });
    }
    loadPriceData(symbols) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = (yield (yield axios_1.default.get(`${API_ENDPOINT}/v1/prices/?symbols=${symbols.join(",")}`)).data);
            return data.results.reduce((acc, price) => (Object.assign(Object.assign({}, acc), { [price.identifier]: Number(price.price) })), {});
        });
    }
    getLatestRewardRate(rewardRates, slot) {
        return rewardRates
            .filter((rr) => slot >= rr.beginningSlot)
            .reduce((v1, v2) => (v1.beginningSlot > v2.beginningSlot ? v1 : v2), {
            beginningSlot: 0,
            rewardRate: "0",
        });
    }
    loadRewards() {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [
                this.loadLMRewardData(),
                this.loadExternalRewardData(),
                this.connection.getSlot("finalized"),
            ];
            const [lmRewards, externalRewards, currentSlot] = yield Promise.all(promises);
            const querySymbols = Object.values(externalRewards)
                .flatMap((reward) => {
                var _a, _b;
                return [
                    (_a = reward.supply) === null || _a === void 0 ? void 0 : _a.rewardSymbol,
                    (_b = reward.borrow) === null || _b === void 0 ? void 0 : _b.rewardSymbol,
                ];
            })
                .filter((x) => x);
            const priceData = yield this.loadPriceData(querySymbols.concat("SLND"));
            this.rewardsData = this.reserves.reduce((acc, reserve) => {
                const { config: { mintAddress }, } = reserve;
                const lmReward = lmRewards[mintAddress];
                const externalReward = externalRewards[mintAddress];
                const supply = [
                    (lmReward === null || lmReward === void 0 ? void 0 : lmReward.supply)
                        ? {
                            rewardRate: this.getLatestRewardRate(lmReward.supply.rewardRates, currentSlot).rewardRate,
                            rewardMint: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
                            rewardSymbol: "SLND",
                            price: new bignumber_js_1.default(priceData.SLND).toNumber(),
                        }
                        : null,
                    (externalReward === null || externalReward === void 0 ? void 0 : externalReward.supply)
                        ? {
                            rewardRate: this.getLatestRewardRate(externalReward.supply.rewardRates, currentSlot).rewardRate,
                            rewardMint: externalReward.supply.rewardMint,
                            rewardSymbol: externalReward.supply.rewardSymbol,
                            price: priceData[externalReward.supply.rewardSymbol],
                        }
                        : null,
                ].filter((x) => x);
                const borrow = [
                    (lmReward === null || lmReward === void 0 ? void 0 : lmReward.borrow)
                        ? {
                            rewardRate: this.getLatestRewardRate(lmReward.borrow.rewardRates, currentSlot).rewardRate,
                            rewardMint: "SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp",
                            rewardSymbol: "SLND",
                            price: new bignumber_js_1.default(priceData.SLND).toNumber(),
                        }
                        : null,
                    (externalReward === null || externalReward === void 0 ? void 0 : externalReward.borrow)
                        ? {
                            rewardRate: this.getLatestRewardRate(externalReward.borrow.rewardRates, currentSlot).rewardRate,
                            rewardMint: externalReward.borrow.rewardMint,
                            rewardSymbol: externalReward.borrow.rewardSymbol,
                            price: priceData[externalReward.borrow.rewardSymbol],
                        }
                        : null,
                ].filter((x) => x);
                return Object.assign(Object.assign({}, acc), { [reserve.config.mintAddress]: {
                        supply,
                        borrow,
                    } });
            }, {});
            const refreshReserves = this.reserves.map((reserve) => {
                return reserve.load();
            });
            yield Promise.all(refreshReserves);
        });
    }
    loadReserves() {
        return __awaiter(this, void 0, void 0, function* () {
            const addresses = this.reserves.map((reserve) => new web3_js_1.PublicKey(reserve.config.address));
            const reserveAccounts = yield this.connection.getMultipleAccountsInfo(addresses, "processed");
            const loadReserves = this.reserves.map((reserve, index) => {
                reserve.setBuffer(reserveAccounts[index]);
                return reserve.load();
            });
            yield Promise.all(loadReserves);
        });
    }
    refreshAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [
                this.reserves.every((reserve) => reserve.stats)
                    ? this.loadReserves()
                    : null,
                this.rewardsData ? this.loadRewards() : null,
            ].filter((x) => x);
            yield Promise.all(promises);
        });
    }
}
exports.SolendMarket = SolendMarket;
class SolendReserve {
    constructor(reserveConfig, market, connection) {
        this.calculateSupplyAPY = (reserve) => {
            const apr = this.calculateSupplyAPR(reserve);
            const apy = Math.pow(new bignumber_js_1.default(1)
                .plus(new bignumber_js_1.default(apr).dividedBy(constants_1.SLOTS_PER_YEAR))
                .toNumber(), constants_1.SLOTS_PER_YEAR) -
                1;
            return apy;
        };
        this.calculateBorrowAPY = (reserve) => {
            const apr = this.calculateBorrowAPR(reserve);
            const apy = Math.pow(new bignumber_js_1.default(1)
                .plus(new bignumber_js_1.default(apr).dividedBy(constants_1.SLOTS_PER_YEAR))
                .toNumber(), constants_1.SLOTS_PER_YEAR) -
                1;
            return apy;
        };
        this.config = reserveConfig;
        this.market = market;
        this.buffer = null;
        this.stats = null;
        this.connection = connection;
    }
    calculateSupplyAPR(reserve) {
        const currentUtilization = this.calculateUtilizationRatio(reserve);
        const borrowAPY = this.calculateBorrowAPR(reserve);
        return currentUtilization * borrowAPY;
    }
    calculateUtilizationRatio(reserve) {
        const totalBorrowsWads = new bignumber_js_1.default(reserve.liquidity.borrowedAmountWads.toString()).div(constants_1.WAD);
        const currentUtilization = totalBorrowsWads
            .dividedBy(totalBorrowsWads.plus(reserve.liquidity.availableAmount.toString()))
            .toNumber();
        return currentUtilization;
    }
    calculateBorrowAPR(reserve) {
        const currentUtilization = this.calculateUtilizationRatio(reserve);
        const optimalUtilization = reserve.config.optimalUtilizationRate / 100;
        let borrowAPR;
        if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
            const normalizedFactor = currentUtilization / optimalUtilization;
            const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
            const minBorrowRate = reserve.config.minBorrowRate / 100;
            borrowAPR =
                normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
        }
        else {
            const normalizedFactor = (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
            const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
            const maxBorrowRate = reserve.config.maxBorrowRate / 100;
            borrowAPR =
                normalizedFactor * (maxBorrowRate - optimalBorrowRate) +
                    optimalBorrowRate;
        }
        return borrowAPR;
    }
    setBuffer(buffer) {
        this.buffer = buffer;
    }
    load() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.buffer) {
                this.buffer = yield this.connection.getAccountInfo(new web3_js_1.PublicKey(this.config.address), "processed");
            }
            if (!this.buffer) {
                throw Error(`Error requesting account info for ${this.config.name}`);
            }
            const parsedData = (_a = (0, reserve_1.parseReserve)(new web3_js_1.PublicKey(this.config.address), this.buffer)) === null || _a === void 0 ? void 0 : _a.info;
            if (!parsedData) {
                throw Error(`Unable to parse data of reserve ${this.config.name}`);
            }
            this.stats = yield this.formatReserveData(parsedData);
        });
    }
    calculateRewardAPY(rewardRate, poolSize, rewardPrice, tokenPrice, decimals) {
        const poolValueUSD = new bignumber_js_1.default(poolSize)
            .times(tokenPrice)
            .dividedBy("1".concat(Array(decimals + 1).join("0")))
            .dividedBy(constants_1.WAD);
        return new bignumber_js_1.default(rewardRate)
            .multipliedBy(rewardPrice)
            .dividedBy(poolValueUSD)
            .dividedBy(constants_1.WANG);
    }
    totalSupplyAPY() {
        var _a;
        const { stats } = this;
        if (!this.market.rewardsData || !stats) {
            throw Error("SolendMarket must be initialized with the withRewardData flag as true and load must be called on the reserve.");
        }
        const rewards = ((_a = this.market.config) === null || _a === void 0 ? void 0 : _a.isPrimary)
            ? this.market.rewardsData[this.config.mintAddress].supply.map((reward) => ({
                rewardMint: reward.rewardMint,
                rewardSymbol: reward.rewardSymbol,
                apy: this.calculateRewardAPY(reward.rewardRate, stats.totalDepositsWads.toString(), reward.price, stats.assetPriceUSD, this.config.decimals).toNumber(),
                price: reward.price,
            }))
            : [];
        const totalAPY = new bignumber_js_1.default(stats.supplyInterestAPY)
            .plus(rewards.reduce((acc, reward) => acc.plus(reward.apy), new bignumber_js_1.default(0)))
            .toNumber();
        return {
            interestAPY: stats.supplyInterestAPY,
            totalAPY,
            rewards,
        };
    }
    totalBorrowAPY() {
        var _a;
        const { stats } = this;
        if (!this.market.rewardsData || !stats) {
            throw Error("SolendMarket must be initialized with the withRewardData flag as true and load must be called on the reserve.");
        }
        const rewards = ((_a = this.market.config) === null || _a === void 0 ? void 0 : _a.isPrimary)
            ? this.market.rewardsData[this.config.mintAddress].borrow.map((reward) => ({
                rewardMint: reward.rewardMint,
                rewardSymbol: reward.rewardSymbol,
                apy: this.calculateRewardAPY(reward.rewardRate, stats.totalBorrowsWads.toString(), reward.price, stats.assetPriceUSD, this.config.decimals).toNumber(),
                price: reward.price,
            }))
            : [];
        const totalAPY = new bignumber_js_1.default(stats.borrowInterestAPY)
            .minus(rewards.reduce((acc, reward) => acc.plus(reward.apy), new bignumber_js_1.default(0)))
            .toNumber();
        return {
            interestAPY: stats.borrowInterestAPY,
            totalAPY,
            rewards,
        };
    }
    formatReserveData(parsedData) {
        const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
        const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(new bn_js_1.default(constants_1.WAD));
        const totalDepositsWads = totalBorrowsWads.add(totalLiquidityWads);
        const cTokenExchangeRate = new bignumber_js_1.default(totalDepositsWads.toString())
            .div(parsedData.collateral.mintTotalSupply.toString())
            .div(constants_1.WAD)
            .toNumber();
        return {
            // Reserve config
            optimalUtilizationRate: parsedData.config.optimalUtilizationRate / 100,
            loanToValueRatio: parsedData.config.loanToValueRatio / 100,
            liquidationBonus: parsedData.config.liquidationBonus / 100,
            liquidationThreshold: parsedData.config.liquidationThreshold / 100,
            minBorrowRate: parsedData.config.minBorrowRate / 100,
            optimalBorrowRate: parsedData.config.optimalBorrowRate / 100,
            maxBorrowRate: parsedData.config.maxBorrowRate / 100,
            borrowFeePercentage: new bignumber_js_1.default(parsedData.config.fees.borrowFeeWad.toString())
                .dividedBy(constants_1.WAD)
                .toNumber(),
            hostFeePercentage: parsedData.config.fees.hostFeePercentage / 100,
            depositLimit: parsedData.config.depositLimit,
            reserveBorrowLimit: parsedData.config.borrowLimit,
            // Reserve info
            name: this.config.name,
            symbol: this.config.symbol,
            decimals: this.config.decimals,
            mintAddress: this.config.mintAddress,
            totalDepositsWads,
            totalBorrowsWads,
            totalLiquidityWads,
            supplyInterestAPY: this.calculateSupplyAPY(parsedData),
            borrowInterestAPY: this.calculateBorrowAPY(parsedData),
            assetPriceUSD: new bignumber_js_1.default(parsedData.liquidity.marketPrice.toString())
                .div(constants_1.WAD)
                .toNumber(),
            userDepositLimit: this.config.userSupplyCap,
            cumulativeBorrowRateWads: parsedData.liquidity.cumulativeBorrowRateWads,
            cTokenExchangeRate,
        };
    }
}
exports.SolendReserve = SolendReserve;
class SolendObligation {
    constructor(walletAddress, obligationAddress, obligation, reserves) {
        this.walletAddress = walletAddress;
        this.obligationAddress = obligationAddress;
        const positionDetails = this.calculatePositions(obligation, reserves);
        this.deposits = positionDetails.deposits;
        this.borrows = positionDetails.borrows;
        this.obligationStats = positionDetails.stats;
    }
    calculatePositions(obligation, reserves) {
        let userTotalDeposit = new bignumber_js_1.default(0);
        let borrowLimit = new bignumber_js_1.default(0);
        let liquidationThreshold = new bignumber_js_1.default(0);
        let positions = 0;
        const deposits = obligation.deposits.map((deposit) => {
            const reserve = reserves.find((reserve) => reserve.config.address === deposit.depositReserve.toBase58());
            const loanToValue = reserve.stats.loanToValueRatio;
            const liqThreshold = reserve.stats.liquidationThreshold;
            const supplyAmount = new bn_js_1.default(Math.floor(new bignumber_js_1.default(deposit.depositedAmount.toString())
                .multipliedBy(reserve.stats.cTokenExchangeRate)
                .toNumber()));
            const supplyAmountUSD = new bignumber_js_1.default(supplyAmount.toString())
                .multipliedBy(reserve.stats.assetPriceUSD)
                .dividedBy("1".concat(Array(reserve.stats.decimals + 1).join("0")));
            userTotalDeposit = userTotalDeposit.plus(supplyAmountUSD);
            borrowLimit = borrowLimit.plus(supplyAmountUSD.multipliedBy(loanToValue));
            liquidationThreshold = liquidationThreshold.plus(supplyAmountUSD.multipliedBy(liqThreshold));
            if (!supplyAmount.eq(new bn_js_1.default("0"))) {
                positions += 1;
            }
            return {
                mintAddress: reserve.config.mintAddress,
                amount: supplyAmount,
            };
        });
        let userTotalBorrow = new bignumber_js_1.default(0);
        const borrows = obligation.borrows.map((borrow) => {
            const reserve = reserves.find((reserve) => reserve.config.address === borrow.borrowReserve.toBase58());
            const borrowAmount = new bn_js_1.default(Math.floor(new bignumber_js_1.default(borrow.borrowedAmountWads.toString())
                .multipliedBy(reserve.stats.cumulativeBorrowRateWads.toString())
                .dividedBy(borrow.cumulativeBorrowRateWads.toString())
                .dividedBy(constants_1.WAD)
                .toNumber()).toString());
            const borrowAmountUSD = new bignumber_js_1.default(borrowAmount.toString())
                .multipliedBy(reserve.stats.assetPriceUSD)
                .dividedBy("1".concat(Array(reserve.stats.decimals + 1).join("0")));
            if (!borrowAmount.eq(new bn_js_1.default("0"))) {
                positions += 1;
            }
            userTotalBorrow = userTotalBorrow.plus(borrowAmountUSD);
            return {
                mintAddress: reserve.config.mintAddress,
                amount: borrowAmount,
            };
        });
        return {
            deposits,
            borrows,
            stats: {
                liquidationThreshold: liquidationThreshold.toNumber(),
                userTotalDeposit: userTotalDeposit.toNumber(),
                userTotalBorrow: userTotalBorrow.toNumber(),
                borrowLimit: borrowLimit.toNumber(),
                borrowUtilization: userTotalBorrow.dividedBy(borrowLimit).toNumber(),
                netAccountValue: userTotalDeposit.minus(userTotalBorrow).toNumber(),
                positions,
            },
        };
    }
}
exports.SolendObligation = SolendObligation;
/* eslint-enable max-classes-per-file */
