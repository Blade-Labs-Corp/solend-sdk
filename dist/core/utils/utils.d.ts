/// <reference types="node" />
import { Connection, PublicKey } from "@solana/web3.js";
export declare const formatAddress: (address: string, length?: number) => string;
export declare const titleCase: (name: string) => string;
export declare function getBatchMultipleAccountsInfo(addresses: Array<string | PublicKey>, connection: Connection): Promise<(import("@solana/web3.js").AccountInfo<Buffer> | null)[]>;
export declare function createObligationAddress(publicKey: string, marketAddress: string, programId: string): Promise<string>;
export declare function computeExtremeRates(configRate: number): number;
