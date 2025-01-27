/// <reference types="node" />
import { AccountInfo, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { LastUpdate } from "./lastUpdate";
declare const BufferLayout: any;
export interface Obligation {
    version: number;
    lastUpdate: LastUpdate;
    lendingMarket: PublicKey;
    owner: PublicKey;
    deposits: ObligationCollateral[];
    borrows: ObligationLiquidity[];
    depositedValue: BN;
    borrowedValue: BN;
    allowedBorrowValue: BN;
    unhealthyBorrowValue: BN;
}
export declare function obligationToString(obligation: Obligation): string;
export interface ObligationCollateral {
    depositReserve: PublicKey;
    depositedAmount: BN;
    marketValue: BN;
}
export interface ObligationLiquidity {
    borrowReserve: PublicKey;
    cumulativeBorrowRateWads: BN;
    borrowedAmountWads: BN;
    marketValue: BN;
}
export declare const ObligationLayout: typeof BufferLayout.Structure;
export declare const ObligationCollateralLayout: typeof BufferLayout.Structure;
export declare const ObligationLiquidityLayout: typeof BufferLayout.Structure;
export declare const OBLIGATION_SIZE: any;
export declare const isObligation: (info: AccountInfo<Buffer>) => boolean;
export interface ProtoObligation {
    version: number;
    lastUpdate: LastUpdate;
    lendingMarket: PublicKey;
    owner: PublicKey;
    depositedValue: BN;
    borrowedValue: BN;
    allowedBorrowValue: BN;
    unhealthyBorrowValue: BN;
    depositsLen: number;
    borrowsLen: number;
    dataFlat: Buffer;
}
export declare const parseObligation: (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: Obligation;
} | null;
export {};
