/// <reference types="node" />
import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Obligation } from "../../state";
import { PoolType } from "../types";
export declare function formatObligation(obligation: {
    pubkey: PublicKey;
    info: Obligation;
}, pool: PoolType): {
    address: string;
    positions: number;
    deposits: {
        liquidationThreshold: number;
        loanToValueRatio: number;
        symbol: string | undefined;
        price: BigNumber;
        reserveAddress: string;
        amount: BigNumber;
        amountUsd: BigNumber;
    }[];
    borrows: {
        liquidationThreshold: number;
        loanToValueRatio: number;
        symbol: string | undefined;
        price: BigNumber;
        reserveAddress: string;
        amount: BigNumber;
        amountUsd: BigNumber;
    }[];
    poolAddress: string;
    totalSupplyValue: BigNumber;
    totalBorrowValue: BigNumber;
    borrowLimit: BigNumber;
    liquidationThreshold: BigNumber;
    netAccountValue: BigNumber;
    liquidationThresholdFactor: BigNumber;
    borrowLimitFactor: BigNumber;
    borrowUtilization: BigNumber;
    isBorrowLimitReached: boolean;
    borrowOverSupply: BigNumber;
    borrowLimitOverSupply: BigNumber;
};
export declare function fetchObligationByAddress(obligationAddress: string, connection: Connection, debug?: boolean): Promise<{
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: Obligation;
} | null>;
export declare function fetchObligationsByAddress(obligationAddresses: Array<string>, connection: Connection, debug?: boolean): Promise<{
    info: Obligation;
    pubkey: PublicKey;
}[]>;
