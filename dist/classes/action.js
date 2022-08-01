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
exports.SolendAction = exports.POSITION_LIMIT = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const obligation_1 = require("../state/obligation");
const bn_js_1 = __importDefault(require("bn.js"));
const instructions_1 = require("../instructions");
const constants_1 = require("./constants");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const __1 = require("..");
const axios_1 = __importDefault(require("axios"));
exports.POSITION_LIMIT = 6;
const API_ENDPOINT = "https://api.solend.fi";
const SOL_PADDING_FOR_INTEREST = "1000000";
function getTokenInfo(symbol, solendInfo) {
    const tokenInfo = solendInfo.assets.find((asset) => asset.symbol === symbol);
    if (!tokenInfo) {
        throw new Error(`Could not find ${symbol} in ASSETS`);
    }
    return tokenInfo;
}
class SolendAction {
    constructor(solendInfo, connection, reserve, lendingMarket, tokenInfo, publicKey, obligationAddress, obligationAccountInfo, userTokenAccountAddress, userCollateralAccountAddress, seed, symbol, positions, amount, depositReserves, borrowReserves, hostAta) {
        this.solendInfo = solendInfo;
        this.connection = connection;
        this.publicKey = publicKey;
        this.amount = new bn_js_1.default(amount);
        this.symbol = symbol;
        this.positions = positions;
        this.hostAta = hostAta;
        this.obligationAccountInfo = obligationAccountInfo;
        this.lendingMarket = lendingMarket;
        this.seed = seed;
        this.reserve = reserve;
        const oracleInfo = solendInfo.oracles.assets.find((oracle) => oracle.asset === symbol);
        if (!oracleInfo) {
            throw new Error(`Could not find oracleInfo for ${symbol} in reserves`);
        }
        this.oracleInfo = oracleInfo;
        this.tokenInfo = tokenInfo;
        this.obligationAddress = obligationAddress;
        this.userTokenAccountAddress = userTokenAccountAddress;
        this.userCollateralAccountAddress = userCollateralAccountAddress;
        this.setupIxs = [];
        this.lendingIxs = [];
        this.cleanupIxs = [];
        this.preTxnIxs = [];
        this.postTxnIxs = [];
        this.depositReserves = depositReserves;
        this.borrowReserves = borrowReserves;
    }
    static initialize(action, amount, symbol, publicKey, connection, environment = "production", lendingMarketAddress, hostAta) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const solendInfo = typeof environment == "string" ? (yield (yield axios_1.default.get(`${API_ENDPOINT}/v1/config?deployment=${environment}`)).data) : environment;
            const lendingMarket = (_b = (_a = solendInfo.markets.find((market) => market.address === (lendingMarketAddress === null || lendingMarketAddress === void 0 ? void 0 : lendingMarketAddress.toString()))) !== null && _a !== void 0 ? _a : solendInfo.markets.find((market) => market.isPrimary)) !== null && _b !== void 0 ? _b : solendInfo.markets[0];
            const seed = lendingMarket.address.slice(0, 32);
            const obligationAddress = yield web3_js_1.PublicKey.createWithSeed(publicKey, seed, new web3_js_1.PublicKey(solendInfo.programID));
            const reserve = lendingMarket.reserves.find((res) => res.asset === symbol);
            if (!reserve) {
                throw new Error(`Could not find asset ${symbol} in reserves`);
            }
            const obligationAccountInfo = yield connection.getAccountInfo(obligationAddress);
            let obligationDetails = null;
            const depositReserves = [];
            const borrowReserves = [];
            if (obligationAccountInfo) {
                obligationDetails = (0, obligation_1.parseObligation)(web3_js_1.PublicKey.default, obligationAccountInfo).info;
                obligationDetails.deposits.forEach((deposit) => {
                    depositReserves.push(deposit.depositReserve);
                });
                obligationDetails.borrows.forEach((borrow) => {
                    borrowReserves.push(borrow.borrowReserve);
                });
            }
            // Union of addresses
            const distinctReserveCount = [
                ...new Set([
                    ...borrowReserves.map((e) => e.toBase58()),
                    ...(action === "borrow" ? [reserve.address] : []),
                ]),
            ].length +
                [
                    ...new Set([
                        ...depositReserves.map((e) => e.toBase58()),
                        ...(action === "deposit" ? [reserve.address] : []),
                    ]),
                ].length;
            if (distinctReserveCount > exports.POSITION_LIMIT) {
                throw Error(`Obligation already has max number of positions: ${exports.POSITION_LIMIT}`);
            }
            const tokenInfo = getTokenInfo(symbol, solendInfo);
            const userTokenAccountAddress = yield spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(tokenInfo.mintAddress), publicKey, true);
            const userCollateralAccountAddress = yield spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(reserve.collateralMintAddress), publicKey, true);
            return new SolendAction(solendInfo, connection, reserve, lendingMarket, tokenInfo, publicKey, obligationAddress, obligationDetails, userTokenAccountAddress, userCollateralAccountAddress, seed, symbol, distinctReserveCount, amount, depositReserves, borrowReserves, hostAta);
        });
    }
    static buildDepositTxns(connection, amount, symbol, publicKey, environment = "production", lendingMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const axn = yield SolendAction.initialize("deposit", amount, symbol, publicKey, connection, environment, lendingMarketAddress);
            yield axn.addSupportIxs("deposit");
            yield axn.addDepositIx();
            return axn;
        });
    }
    static buildBorrowTxns(connection, amount, symbol, publicKey, environment = "production", hostAta, lendingMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const axn = yield SolendAction.initialize("borrow", amount, symbol, publicKey, connection, environment, lendingMarketAddress, hostAta);
            yield axn.addSupportIxs("borrow");
            yield axn.addBorrowIx();
            return axn;
        });
    }
    static buildDepositReserveLiquidityTxns(connection, amount, symbol, publicKey, environment = "production", lendingMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const axn = yield SolendAction.initialize("mint", amount, symbol, publicKey, connection, environment, lendingMarketAddress);
            yield axn.addSupportIxs("mint");
            yield axn.addDepositReserveLiquidityIx();
            return axn;
        });
    }
    static buildRedeemReserveCollateralTxns(connection, amount, symbol, publicKey, environment = "production", lendingMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const axn = yield SolendAction.initialize("redeem", amount, symbol, publicKey, connection, environment, lendingMarketAddress);
            yield axn.addSupportIxs("redeem");
            yield axn.addRedeemReserveCollateralIx();
            return axn;
        });
    }
    static buildDepositObligationCollateralTxns(connection, amount, symbol, publicKey, environment = "production", lendingMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const axn = yield SolendAction.initialize("depositCollateral", amount, symbol, publicKey, connection, environment, lendingMarketAddress);
            yield axn.addSupportIxs("depositCollateral");
            yield axn.addDepositObligationCollateralIx();
            return axn;
        });
    }
    static buildWithdrawTxns(connection, amount, symbol, publicKey, environment = "production", lendingMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const axn = yield SolendAction.initialize("withdraw", amount, symbol, publicKey, connection, environment, lendingMarketAddress);
            yield axn.addSupportIxs("withdraw");
            yield axn.addWithdrawIx();
            return axn;
        });
    }
    static buildRepayTxns(connection, amount, symbol, publicKey, environment = "production", lendingMarketAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const axn = yield SolendAction.initialize("repay", amount, symbol, publicKey, connection, environment, lendingMarketAddress);
            yield axn.addSupportIxs("repay");
            yield axn.addRepayIx();
            return axn;
        });
    }
    getTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const txns = {
                preLendingTxn: null,
                lendingTxn: null,
                postLendingTxn: null,
            };
            if (this.preTxnIxs.length) {
                txns.preLendingTxn = new web3_js_1.Transaction({
                    feePayer: this.publicKey,
                    recentBlockhash: (yield this.connection.getRecentBlockhash()).blockhash,
                }).add(...this.preTxnIxs);
            }
            txns.lendingTxn = new web3_js_1.Transaction({
                feePayer: this.publicKey,
                recentBlockhash: (yield this.connection.getRecentBlockhash()).blockhash,
            }).add(...this.setupIxs, ...this.lendingIxs, ...this.cleanupIxs);
            if (this.postTxnIxs.length) {
                txns.postLendingTxn = new web3_js_1.Transaction({
                    feePayer: this.publicKey,
                    recentBlockhash: (yield this.connection.getRecentBlockhash()).blockhash,
                }).add(...this.postTxnIxs);
            }
            return txns;
        });
    }
    sendTransactions(sendTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const txns = yield this.getTransactions();
            yield this.sendSingleTransaction(txns.preLendingTxn, sendTransaction);
            const signature = yield this.sendSingleTransaction(txns.lendingTxn, sendTransaction);
            yield this.sendSingleTransaction(txns.postLendingTxn, sendTransaction);
            return signature;
        });
    }
    sendSingleTransaction(txn, sendTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!txn)
                return "";
            const signature = yield sendTransaction(txn, this.connection);
            yield this.connection.confirmTransaction(signature);
            return signature;
        });
    }
    addDepositIx() {
        this.lendingIxs.push((0, instructions_1.depositReserveLiquidityAndObligationCollateralInstruction)(this.amount, this.userTokenAccountAddress, this.userCollateralAccountAddress, new web3_js_1.PublicKey(this.reserve.address), new web3_js_1.PublicKey(this.reserve.liquidityAddress), new web3_js_1.PublicKey(this.reserve.collateralMintAddress), new web3_js_1.PublicKey(this.lendingMarket.address), new web3_js_1.PublicKey(this.lendingMarket.authorityAddress), new web3_js_1.PublicKey(this.reserve.collateralSupplyAddress), // destinationCollateral
        this.obligationAddress, // obligation
        this.publicKey, // obligationOwner
        new web3_js_1.PublicKey(this.oracleInfo.priceAddress), new web3_js_1.PublicKey(this.oracleInfo.switchboardFeedAddress), this.publicKey, // transferAuthority
        new web3_js_1.PublicKey(this.solendInfo.programID)));
    }
    addDepositReserveLiquidityIx() {
        this.lendingIxs.push((0, instructions_1.depositReserveLiquidityInstruction)(this.amount, this.userTokenAccountAddress, this.userCollateralAccountAddress, new web3_js_1.PublicKey(this.reserve.address), new web3_js_1.PublicKey(this.reserve.liquidityAddress), new web3_js_1.PublicKey(this.reserve.collateralMintAddress), new web3_js_1.PublicKey(this.lendingMarket.address), new web3_js_1.PublicKey(this.lendingMarket.authorityAddress), this.publicKey, // transferAuthority
        new web3_js_1.PublicKey(this.solendInfo.programID)));
    }
    addRedeemReserveCollateralIx() {
        this.lendingIxs.push((0, instructions_1.redeemReserveCollateralInstruction)(this.amount, this.userCollateralAccountAddress, this.userTokenAccountAddress, new web3_js_1.PublicKey(this.reserve.address), new web3_js_1.PublicKey(this.reserve.collateralMintAddress), new web3_js_1.PublicKey(this.reserve.liquidityAddress), new web3_js_1.PublicKey(this.lendingMarket.address), // lendingMarket
        new web3_js_1.PublicKey(this.lendingMarket.authorityAddress), // lendingMarketAuthority
        this.publicKey, // transferAuthority
        new web3_js_1.PublicKey(this.solendInfo.programID)));
    }
    addDepositObligationCollateralIx() {
        this.lendingIxs.push((0, instructions_1.depositObligationCollateralInstruction)(this.amount, this.userCollateralAccountAddress, new web3_js_1.PublicKey(this.reserve.collateralSupplyAddress), new web3_js_1.PublicKey(this.reserve.address), this.obligationAddress, // obligation
        new web3_js_1.PublicKey(this.lendingMarket.address), this.publicKey, // obligationOwner
        this.publicKey, // transferAuthority
        new web3_js_1.PublicKey(this.solendInfo.programID)));
    }
    addBorrowIx() {
        this.lendingIxs.push((0, instructions_1.borrowObligationLiquidityInstruction)(this.amount, new web3_js_1.PublicKey(this.reserve.liquidityAddress), this.userTokenAccountAddress, new web3_js_1.PublicKey(this.reserve.address), new web3_js_1.PublicKey(this.reserve.liquidityFeeReceiverAddress), this.obligationAddress, new web3_js_1.PublicKey(this.lendingMarket.address), // lendingMarket
        new web3_js_1.PublicKey(this.lendingMarket.authorityAddress), // lendingMarketAuthority
        this.publicKey, new web3_js_1.PublicKey(this.solendInfo.programID), this.hostAta));
    }
    addWithdrawIx() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = yield this.connection.getAccountInfo(new web3_js_1.PublicKey(this.reserve.address), "processed");
            if (!buffer) {
                throw Error(`Unable to fetch reserve data for ${this.reserve.asset}`);
            }
            const parsedData = (_a = (0, __1.parseReserve)(new web3_js_1.PublicKey(this.reserve.address), buffer)) === null || _a === void 0 ? void 0 : _a.info;
            if (!parsedData) {
                throw Error(`Unable to parse data of reserve ${this.reserve.asset}`);
            }
            const totalBorrowsWads = parsedData.liquidity.borrowedAmountWads;
            const totalLiquidityWads = parsedData.liquidity.availableAmount.mul(new bn_js_1.default(constants_1.WAD));
            const totalDepositsWads = totalBorrowsWads.add(totalLiquidityWads);
            const cTokenExchangeRate = new bignumber_js_1.default(totalDepositsWads.toString())
                .div(parsedData.collateral.mintTotalSupply.toString())
                .div(constants_1.WAD);
            this.lendingIxs.push((0, instructions_1.withdrawObligationCollateralAndRedeemReserveLiquidity)(this.amount === new bn_js_1.default(constants_1.U64_MAX)
                ? this.amount
                : new bn_js_1.default(new bignumber_js_1.default(this.amount.toString())
                    .dividedBy(cTokenExchangeRate)
                    .integerValue(bignumber_js_1.default.ROUND_FLOOR)
                    .toString()), new web3_js_1.PublicKey(this.reserve.collateralSupplyAddress), this.userCollateralAccountAddress, new web3_js_1.PublicKey(this.reserve.address), this.obligationAddress, new web3_js_1.PublicKey(this.lendingMarket.address), new web3_js_1.PublicKey(this.lendingMarket.authorityAddress), this.userTokenAccountAddress, // destinationLiquidity
            new web3_js_1.PublicKey(this.reserve.collateralMintAddress), new web3_js_1.PublicKey(this.reserve.liquidityAddress), this.publicKey, // obligationOwner
            this.publicKey, // transferAuthority
            new web3_js_1.PublicKey(this.solendInfo.programID)));
        });
    }
    addRepayIx() {
        return __awaiter(this, void 0, void 0, function* () {
            this.lendingIxs.push((0, instructions_1.repayObligationLiquidityInstruction)(this.amount, this.userTokenAccountAddress, new web3_js_1.PublicKey(this.reserve.liquidityAddress), new web3_js_1.PublicKey(this.reserve.address), this.obligationAddress, new web3_js_1.PublicKey(this.lendingMarket.address), this.publicKey, new web3_js_1.PublicKey(this.solendInfo.programID)));
        });
    }
    addSupportIxs(action) {
        return __awaiter(this, void 0, void 0, function* () {
            if (["withdraw", "borrow"].includes(action)) {
                yield this.addRefreshIxs();
            }
            if (!["mint", "redeem"].includes(action)) {
                yield this.addObligationIxs();
            }
            yield this.addAtaIxs(action);
        });
    }
    addRefreshIxs() {
        return __awaiter(this, void 0, void 0, function* () {
            // Union of addresses
            const allReserveAddresses = [
                ...new Set([
                    ...this.depositReserves.map((e) => e.toBase58()),
                    ...this.borrowReserves.map((e) => e.toBase58()),
                    this.reserve.address,
                ]),
            ];
            allReserveAddresses.forEach((reserveAddress) => {
                const reserveInfo = this.lendingMarket.reserves.find((reserve) => reserve.address === reserveAddress);
                if (!reserveInfo) {
                    throw new Error(`Could not find asset ${reserveAddress} in reserves`);
                }
                const oracleInfo = this.solendInfo.oracles.assets.find((asset) => asset.asset === reserveInfo.asset);
                if (!oracleInfo) {
                    throw new Error(`Could not find asset ${reserveInfo.asset} in reserves`);
                }
                const refreshReserveIx = (0, instructions_1.refreshReserveInstruction)(new web3_js_1.PublicKey(reserveAddress), new web3_js_1.PublicKey(this.solendInfo.programID), new web3_js_1.PublicKey(oracleInfo.priceAddress), new web3_js_1.PublicKey(oracleInfo.switchboardFeedAddress));
                this.setupIxs.push(refreshReserveIx);
            });
            const refreshObligationIx = (0, instructions_1.refreshObligationInstruction)(this.obligationAddress, this.depositReserves, this.borrowReserves, new web3_js_1.PublicKey(this.solendInfo.programID));
            this.setupIxs.push(refreshObligationIx);
        });
    }
    addObligationIxs() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.obligationAccountInfo) {
                const obligationAccountInfoRentExempt = yield this.connection.getMinimumBalanceForRentExemption(obligation_1.OBLIGATION_SIZE);
                this.setupIxs.push(web3_js_1.SystemProgram.createAccountWithSeed({
                    fromPubkey: this.publicKey,
                    newAccountPubkey: this.obligationAddress,
                    basePubkey: this.publicKey,
                    seed: this.seed,
                    lamports: obligationAccountInfoRentExempt,
                    space: obligation_1.OBLIGATION_SIZE,
                    programId: new web3_js_1.PublicKey(this.solendInfo.programID),
                }));
                const initObligationIx = (0, instructions_1.initObligationInstruction)(this.obligationAddress, new web3_js_1.PublicKey(this.lendingMarket.address), this.publicKey, new web3_js_1.PublicKey(this.solendInfo.programID));
                this.setupIxs.push(initObligationIx);
            }
        });
    }
    addAtaIxs(action) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.symbol === "SOL") {
                yield this.updateWSOLAccount(action);
            }
            if ((action === "withdraw" || action === "borrow" || action === "redeem") &&
                this.symbol !== "SOL") {
                const userTokenAccountInfo = yield this.connection.getAccountInfo(this.userTokenAccountAddress);
                if (!userTokenAccountInfo) {
                    const createUserTokenAccountIx = spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(this.tokenInfo.mintAddress), this.userTokenAccountAddress, this.publicKey, this.publicKey);
                    if (this.positions === exports.POSITION_LIMIT && this.hostAta) {
                        this.preTxnIxs.push(createUserTokenAccountIx);
                    }
                    else {
                        this.setupIxs.push(createUserTokenAccountIx);
                    }
                }
            }
            if (action === "withdraw" || action === "mint" || action === "deposit") {
                const userCollateralAccountInfo = yield this.connection.getAccountInfo(this.userCollateralAccountAddress);
                if (!userCollateralAccountInfo) {
                    const createUserCollateralAccountIx = spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, new web3_js_1.PublicKey(this.reserve.collateralMintAddress), this.userCollateralAccountAddress, this.publicKey, this.publicKey);
                    if (this.positions === exports.POSITION_LIMIT && this.symbol === "SOL") {
                        this.preTxnIxs.push(createUserCollateralAccountIx);
                    }
                    else {
                        this.setupIxs.push(createUserCollateralAccountIx);
                    }
                }
            }
        });
    }
    updateWSOLAccount(action) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const preIxs = [];
            const postIxs = [];
            let safeRepay = new bn_js_1.default(this.amount);
            if (this.obligationAccountInfo &&
                action === "repay" &&
                this.amount === new bn_js_1.default(constants_1.U64_MAX)) {
                const buffer = yield this.connection.getAccountInfo(new web3_js_1.PublicKey(this.reserve.address), "processed");
                if (!buffer) {
                    throw Error(`Unable to fetch reserve data for ${this.reserve.asset}`);
                }
                const parsedData = (_a = (0, __1.parseReserve)(new web3_js_1.PublicKey(this.reserve.address), buffer)) === null || _a === void 0 ? void 0 : _a.info;
                if (!parsedData) {
                    throw Error(`Unable to parse data of reserve ${this.reserve.asset}`);
                }
                const borrow = this.obligationAccountInfo.borrows.find((borrow) => borrow.borrowReserve.toBase58() === this.reserve.address);
                if (!borrow) {
                    throw Error(`Unable to find obligation borrow to repay for ${this.obligationAccountInfo.owner.toBase58()}`);
                }
                safeRepay = new bn_js_1.default(Math.floor(new bignumber_js_1.default(borrow.borrowedAmountWads.toString())
                    .multipliedBy(parsedData.liquidity.cumulativeBorrowRateWads.toString())
                    .dividedBy(borrow.cumulativeBorrowRateWads.toString())
                    .dividedBy(constants_1.WAD)
                    .plus(SOL_PADDING_FOR_INTEREST)
                    .toNumber()).toString());
            }
            const userWSOLAccountInfo = yield this.connection.getAccountInfo(this.userTokenAccountAddress);
            const rentExempt = yield spl_token_1.Token.getMinBalanceRentForExemptAccount(this.connection);
            const sendAction = action === "deposit" || action === "repay" || action === "mint";
            const transferLamportsIx = web3_js_1.SystemProgram.transfer({
                fromPubkey: this.publicKey,
                toPubkey: this.userTokenAccountAddress,
                lamports: (userWSOLAccountInfo ? 0 : rentExempt) +
                    (sendAction ? parseInt(safeRepay.toString(), 10) : 0),
            });
            preIxs.push(transferLamportsIx);
            const closeWSOLAccountIx = spl_token_1.Token.createCloseAccountInstruction(spl_token_1.TOKEN_PROGRAM_ID, this.userTokenAccountAddress, this.publicKey, this.publicKey, []);
            if (userWSOLAccountInfo) {
                const syncIx = (0, instructions_1.syncNative)(this.userTokenAccountAddress);
                if (sendAction) {
                    preIxs.push(syncIx);
                }
                else {
                    postIxs.push(closeWSOLAccountIx);
                }
            }
            else {
                const createUserWSOLAccountIx = spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.NATIVE_MINT, this.userTokenAccountAddress, this.publicKey, this.publicKey);
                preIxs.push(createUserWSOLAccountIx);
                postIxs.push(closeWSOLAccountIx);
            }
            if (this.positions && this.positions >= exports.POSITION_LIMIT) {
                this.preTxnIxs.push(...preIxs);
                this.postTxnIxs.push(...postIxs);
            }
            else {
                this.setupIxs.push(...preIxs);
                this.cleanupIxs.push(...postIxs);
            }
        });
    }
}
exports.SolendAction = SolendAction;
