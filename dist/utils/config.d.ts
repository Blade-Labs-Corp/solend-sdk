import { Connection, PublicKey } from "@solana/web3.js";
import { ConfigType } from "../classes";
export declare type LendingReserveData = {
    reserve: PublicKey;
    name: string;
    symbol: string;
    decimals: number;
};
export declare function generateConfig(connection: Connection, marketName: string, reserveAccountData: LendingReserveData[]): Promise<ConfigType>;
