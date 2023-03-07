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
exports.CachedConnection = exports.InMemoryCache = void 0;
class InMemoryCache {
    constructor(expireMS, maxCacheSize = null) {
        this.expireMS = expireMS;
        this.maxCacheSize = maxCacheSize;
        this.data = {};
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedObject = this.data[key];
            if (cachedObject === undefined || cachedObject === null) {
                return null;
            }
            const msElapsed = Date.now() - cachedObject.timestamp;
            if (msElapsed > this.expireMS) {
                this.data[key] = null;
                return null;
            }
            return cachedObject.value;
        });
    }
    set(key, valuePromise) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = yield valuePromise;
            this.data[key] = {
                timestamp: Date.now(),
                value: value,
            };
            // We don't want to let the cache get infinitely big
            // so we just discard the oldest item
            if (this.maxCacheSize !== null &&
                Object.keys(this.data).length === this.maxCacheSize) {
                delete this.data[Object.keys(this.data)[0]];
            }
            return value;
        });
    }
}
exports.InMemoryCache = InMemoryCache;
// Wraps a cache around a connection. You can define a custom cache by
// implementing the RPCCache interface
class CachedConnection {
    constructor(connection, cache) {
        this.connection = connection;
        this.rpcEndpoint = this.connection.rpcEndpoint;
        this.cache = cache;
    }
    getAccountInfo(publicKey, commitmentOrConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getAccountInfo_${publicKey.toBase58()}_${commitmentOrConfig}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getAccountInfo(publicKey, commitmentOrConfig))));
        });
    }
    getConfirmedSignaturesForAddress2(address, options, commitment) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getConfirmedSignaturesForAddress2_${address.toBase58()}_${JSON.stringify(options)}_${commitment}}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getConfirmedSignaturesForAddress2(address, options, commitment))));
        });
    }
    getLatestBlockhash(commitmentOrConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getLatestBlockhash_${commitmentOrConfig}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getLatestBlockhash(commitmentOrConfig))));
        });
    }
    getMultipleAccountsInfo(publicKeys, commitmentOrConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getMultipleAccountsInfo_${publicKeys
                .map((pk) => pk.toBase58)
                .join("_")}_${JSON.stringify(commitmentOrConfig)}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getMultipleAccountsInfo(publicKeys, commitmentOrConfig))));
        });
    }
    getProgramAccounts(programId, configOrCommitment) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getProgramAccounts_${programId.toBase58()}_${JSON.stringify(configOrCommitment)}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getProgramAccounts(programId, configOrCommitment))));
        });
    }
    getRecentBlockhash(commitment) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getRecentBlockhash_${commitment}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getRecentBlockhash(commitment))));
        });
    }
    getSlot(commitmentOrConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getSlot_${commitmentOrConfig}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getSlot(commitmentOrConfig))));
        });
    }
    getTokenAccountBalance(tokenAddress, commitment) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getTokenAccountBalance_${tokenAddress.toBase58()}_${commitment}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getTokenAccountBalance(tokenAddress, commitment))));
        });
    }
    getTokenSupply(tokenMintAddress, commitment) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getTokenSupply_${tokenMintAddress.toBase58()}_${commitment}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getTokenSupply(tokenMintAddress, commitment))));
        });
    }
    getTransaction(signature, rawConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getTransaction_${signature}_${JSON.stringify(rawConfig)}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getTransaction(signature, rawConfig))));
        });
    }
    // This does not make sense to cache, so we don't
    sendTransaction(transaction, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.connection.sendTransaction(transaction, options);
        });
    }
    simulateTransaction(transaction, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `simulateTransaction_${JSON.stringify(transaction)}_${JSON.stringify(config)}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.simulateTransaction(transaction, config))));
        });
    }
    getAddressLookupTable(accountKey, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `getAddressLookupTable_${accountKey.toBase58()}_${JSON.stringify(config)}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.getAddressLookupTable(accountKey, config))));
        });
    }
    confirmTransaction(strategy, commitment) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `confirmTransaction_${JSON.stringify(strategy)}_${commitment}`;
            return ((yield this.cache.get(key)) ||
                (yield this.cache.set(key, this.connection.confirmTransaction(strategy, commitment))));
        });
    }
}
exports.CachedConnection = CachedConnection;
