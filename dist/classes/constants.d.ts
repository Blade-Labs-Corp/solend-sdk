import { PublicKey } from "@solana/web3.js";
import { EnviromentConfig } from "./shared";
export declare const WAD: string;
export declare const WANG: string;
export declare const U64_MAX = "18446744073709551615";
export declare const SOLEND_PRODUCTION_PROGRAM_ID: PublicKey;
export declare const SOLEND_DEVNET_PROGRAM_ID: PublicKey;
export declare const SOLEND_BETA_PROGRAM_ID: PublicKey;
export declare function getProgramId(environment?: EnviromentConfig): PublicKey;
