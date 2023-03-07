import { Connection, PublicKey } from "@solana/web3.js";
import { SolendObligation } from "./obligation";
import { SolendReserve } from "./reserve";
import { RewardsDataType, MarketConfigType, EnviromentConfig } from "./shared";
export declare class SolendMarket {
    private connection;
    reserves: Array<SolendReserve>;
    rewardsData: RewardsDataType | null;
    config: MarketConfigType;
    programId: PublicKey;
    private constructor();
    static initialize(connection: Connection, environment?: EnviromentConfig, marketAddress?: string): Promise<SolendMarket>;
    fetchObligationByWallet(publicKey: PublicKey): Promise<SolendObligation | null>;
    loadAll(): Promise<void>;
    private loadExternalRewardData;
    private loadPriceData;
    private getLatestRewardRate;
    loadRewards(): Promise<void>;
    loadReserves(): Promise<void>;
    refreshAll(): Promise<void>;
}
