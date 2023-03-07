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
exports.InstrumentedConnection = void 0;
// Adds statsd metrics to RPC calls
class InstrumentedConnection {
    constructor(connection, statsd, prefix = "") {
        this.connection = connection;
        this.statsd = statsd;
        this.prefix = prefix;
        this.rpcEndpoint = this.connection.rpcEndpoint;
    }
    getAccountInfo(publicKey, commitmentOrConfig) {
        return this.withStats(this.connection.getAccountInfo(publicKey, commitmentOrConfig), "getAccountInfo");
    }
    getConfirmedSignaturesForAddress2(address, options, commitment) {
        return this.withStats(this.connection.getConfirmedSignaturesForAddress2(address, options, commitment), "getConfirmedSignaturesForAddress2");
    }
    getLatestBlockhash(commitmentOrConfig) {
        return this.withStats(this.connection.getLatestBlockhash(commitmentOrConfig), "getLatestBlockhash");
    }
    getMultipleAccountsInfo(publicKeys, commitmentOrConfig) {
        return this.withStats(this.connection.getMultipleAccountsInfo(publicKeys, commitmentOrConfig), "getMultipleAccountsInfo");
    }
    getProgramAccounts(programId, configOrCommitment) {
        return this.withStats(this.connection.getProgramAccounts(programId, configOrCommitment), "getProgramAccounts");
    }
    getRecentBlockhash(commitment) {
        return this.withStats(this.connection.getRecentBlockhash(commitment), "getRecentBlockhash");
    }
    getSlot(commitmentOrConfig) {
        return this.withStats(this.connection.getSlot(commitmentOrConfig), "getSlot");
    }
    getTokenAccountBalance(tokenAddress, commitment) {
        return this.withStats(this.connection.getTokenAccountBalance(tokenAddress, commitment), "getTokenAccountBalance");
    }
    getTokenSupply(tokenMintAddress, commitment) {
        return this.withStats(this.connection.getTokenSupply(tokenMintAddress, commitment), "getTokenSupply");
    }
    getTransaction(signature, rawConfig) {
        return this.withStats(this.connection.getTransaction(signature, rawConfig), "getTransaction");
    }
    sendTransaction(transaction, options) {
        return this.withStats(this.connection.sendTransaction(transaction, options), "sendTransaction");
    }
    simulateTransaction(transaction, config) {
        return this.withStats(this.connection.simulateTransaction(transaction, config), "simulateTransaction");
    }
    getAddressLookupTable(accountKey, config) {
        return this.withStats(this.connection.getAddressLookupTable(accountKey, config), "getAddressLookupTable");
    }
    confirmTransaction(strategy, commitment) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.withStats(this.connection.confirmTransaction(strategy, commitment), "confirmTransaction");
        });
    }
    withStats(fn, fnName) {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = [`rpc:${this.prefix}`, `function:${fnName}`];
            this.statsd.increment("rpc_method_call", tags);
            const start = Date.now();
            let result;
            try {
                result = yield fn;
            }
            catch (e) {
                this.statsd.increment("rpc_method_error", tags);
                throw e;
            }
            const duration = Date.now() - start;
            this.statsd.gauge("rpc_method_duration", duration, tags);
            return result;
        });
    }
}
exports.InstrumentedConnection = InstrumentedConnection;
