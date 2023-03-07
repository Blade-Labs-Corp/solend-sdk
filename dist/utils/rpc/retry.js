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
exports.RetryConnection = void 0;
// Adds retries to RPC Calls
class RetryConnection {
    constructor(connection, maxRetries = 3) {
        this.connection = connection;
        this.maxRetries = maxRetries;
        this.rpcEndpoint = this.connection.rpcEndpoint;
    }
    getAccountInfo(publicKey, commitmentOrConfig) {
        return this.withRetries(this.connection.getAccountInfo(publicKey, commitmentOrConfig));
    }
    getConfirmedSignaturesForAddress2(address, options, commitment) {
        return this.withRetries(this.connection.getConfirmedSignaturesForAddress2(address, options, commitment));
    }
    getLatestBlockhash(commitmentOrConfig) {
        return this.withRetries(this.connection.getLatestBlockhash(commitmentOrConfig));
    }
    getMultipleAccountsInfo(publicKeys, commitmentOrConfig) {
        return this.withRetries(this.connection.getMultipleAccountsInfo(publicKeys, commitmentOrConfig));
    }
    getProgramAccounts(programId, configOrCommitment) {
        return this.withRetries(this.connection.getProgramAccounts(programId, configOrCommitment));
    }
    getRecentBlockhash(commitment) {
        return this.withRetries(this.connection.getRecentBlockhash(commitment));
    }
    getSlot(commitmentOrConfig) {
        return this.withRetries(this.connection.getSlot(commitmentOrConfig));
    }
    getTokenAccountBalance(tokenAddress, commitment) {
        return this.withRetries(this.connection.getTokenAccountBalance(tokenAddress, commitment));
    }
    getTokenSupply(tokenMintAddress, commitment) {
        return this.withRetries(this.connection.getTokenSupply(tokenMintAddress, commitment));
    }
    getTransaction(signature, rawConfig) {
        return this.withRetries(this.connection.getTransaction(signature, rawConfig));
    }
    sendTransaction(transaction, options) {
        return this.withRetries(this.connection.sendTransaction(transaction, options));
    }
    simulateTransaction(transaction, config) {
        return this.withRetries(this.connection.simulateTransaction(transaction, config));
    }
    getAddressLookupTable(accountKey, config) {
        return this.withRetries(this.connection.getAddressLookupTable(accountKey, config));
    }
    confirmTransaction(strategy, commitment) {
        return this.withRetries(this.connection.confirmTransaction(strategy, commitment));
    }
    withRetries(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            let numTries = 0;
            let lastException;
            while (numTries <= this.maxRetries) {
                try {
                    return yield fn;
                }
                catch (e) {
                    lastException = e;
                    numTries += 1;
                }
            }
            throw lastException;
        });
    }
}
exports.RetryConnection = RetryConnection;
