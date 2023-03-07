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
exports.MultiConnection = void 0;
// MultiConnection implements SolendRPCConnection
// The default connection is index 0, the rest are backups.
// The default connection's result gets returned as soon as possible
// If the default connection takes longer than backupDelay ms to return,
// the first backup connection to return gets returned.
class MultiConnection {
    constructor(connections, backupDelay = 500) {
        this.connections = connections;
        this.rpcEndpoint = this.connections[0].rpcEndpoint;
        this.delay = backupDelay;
    }
    getAccountInfo(publicKey, commitmentOrConfig) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getAccountInfo(publicKey, commitmentOrConfig))));
    }
    getConfirmedSignaturesForAddress2(address, options, commitment) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getConfirmedSignaturesForAddress2(address, options, commitment))));
    }
    getLatestBlockhash(commitmentOrConfig) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getLatestBlockhash(commitmentOrConfig))));
    }
    getMultipleAccountsInfo(publicKeys, commitmentOrConfig) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getMultipleAccountsInfo(publicKeys, commitmentOrConfig))));
    }
    getProgramAccounts(programId, configOrCommitment) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getProgramAccounts(programId, configOrCommitment))));
    }
    getRecentBlockhash(commitment) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getRecentBlockhash(commitment))));
    }
    getSlot(commitmentOrConfig) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getSlot(commitmentOrConfig))));
    }
    getTokenAccountBalance(tokenAddress, commitment) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getTokenAccountBalance(tokenAddress, commitment))));
    }
    getTokenSupply(tokenMintAddress, commitment) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getTokenSupply(tokenMintAddress, commitment))));
    }
    getTransaction(signature, rawConfig) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getTransaction(signature, rawConfig))));
    }
    // Does it make sense to do multiple instances of this?
    sendTransaction(transaction, options) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.sendTransaction(transaction, options))));
    }
    simulateTransaction(transaction, config) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.simulateTransaction(transaction, config))));
    }
    getAddressLookupTable(accountKey, config) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.getAddressLookupTable(accountKey, config))));
    }
    confirmTransaction(strategy, commitment) {
        return Promise.race(this.connections.map((c, index) => delayed(index === 0 ? 0 : this.delay, c.confirmTransaction(strategy, commitment))));
    }
}
exports.MultiConnection = MultiConnection;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function delayed(ms, promise) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = [promise, sleep(ms)];
        return (yield Promise.all(promises))[0];
    });
}
