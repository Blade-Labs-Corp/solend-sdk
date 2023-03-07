import { Connection, PublicKey } from "@solana/web3.js";
import { CustomEnviromentConfigType } from "../classes";
export type LendingReserveData = {
    reserve: PublicKey;
    name: string;
    symbol: string;
    decimals: number;
};
export declare function generateCustomEnviromentConfig(connection: Connection, marketName: string, marketDescription: string, reserveAccountData: LendingReserveData[]): Promise<CustomEnviromentConfigType>;
