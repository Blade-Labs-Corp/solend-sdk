/// <reference types="node" />
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { ConfigType, EnviromentConfig } from "./types";
import BigNumber from "bignumber.js";
import { Obligation } from "../state/obligation";
import BN from "bn.js";
export declare type RewardInfo = {
    rewardRate: string;
    rewardMint?: string;
    rewardSymbol: string;
    price: number;
};
export declare type RewardsData = {
    [key: string]: {
        supply: Array<RewardInfo>;
        borrow: Array<RewardInfo>;
    };
};
declare type FormattedMarketConfig = ReturnType<typeof formatReserveConfig>;
declare function formatReserveConfig(config: ConfigType, marketAddress?: string): {
    pythProgramID: string;
    switchboardProgramID: string;
    programID: string;
    reserves: {
        priceAddress: string;
        switchboardFeedAddress: string;
        name: string;
        symbol: string;
        decimals: number;
        mintAddress: string;
        asset: string;
        address: string;
        collateralMintAddress: string;
        collateralSupplyAddress: string;
        liquidityAddress: string;
        liquidityFeeReceiverAddress: string;
        userSupplyCap?: number | undefined;
    }[];
    name: string;
    address: string;
    authorityAddress: string;
    isPrimary: boolean;
};
export declare class SolendMarket {
    reserves: Array<SolendReserve>;
    rewardsData: RewardsData | null;
    config: FormattedMarketConfig | null;
    private connection;
    private constructor();
    static initialize(connection: Connection, environment: EnviromentConfig, marketAddress?: string): Promise<SolendMarket>;
    fetchObligationByWallet(publicKey: PublicKey): Promise<SolendObligation | null>;
    loadAll(): Promise<void>;
    private loadLMRewardData;
    private loadExternalRewardData;
    private loadPriceData;
    private getLatestRewardRate;
    loadRewards(): Promise<void>;
    loadReserves(): Promise<void>;
    refreshAll(): Promise<void>;
}
export declare type ReserveData = {
    optimalUtilizationRate: number;
    loanToValueRatio: number;
    liquidationBonus: number;
    liquidationThreshold: number;
    minBorrowRate: number;
    optimalBorrowRate: number;
    maxBorrowRate: number;
    borrowFeePercentage: number;
    hostFeePercentage: number;
    depositLimit: BN;
    reserveBorrowLimit: BN;
    name: string;
    symbol: string;
    decimals: number;
    mintAddress: string;
    totalDepositsWads: BN;
    totalBorrowsWads: BN;
    totalLiquidityWads: BN;
    supplyInterestAPY: number;
    borrowInterestAPY: number;
    assetPriceUSD: number;
    userDepositLimit?: number;
    cumulativeBorrowRateWads: BN;
    cTokenExchangeRate: number;
};
declare type FormattedReserveConfig = FormattedMarketConfig["reserves"][0];
export declare class SolendReserve {
    config: FormattedReserveConfig;
    private market;
    private buffer;
    stats: ReserveData | null;
    private connection;
    constructor(reserveConfig: FormattedReserveConfig, market: SolendMarket, connection: Connection);
    private calculateSupplyAPY;
    private calculateBorrowAPY;
    private calculateSupplyAPR;
    private calculateUtilizationRatio;
    private calculateBorrowAPR;
    setBuffer(buffer: AccountInfo<Buffer> | null): void;
    load(): Promise<void>;
    calculateRewardAPY(rewardRate: string, poolSize: string, rewardPrice: number, tokenPrice: number, decimals: number): BigNumber;
    totalSupplyAPY(): {
        interestAPY: number;
        totalAPY: number;
        rewards: {
            rewardMint: string | undefined;
            rewardSymbol: string;
            apy: number;
            price: number;
        }[];
    };
    totalBorrowAPY(): {
        interestAPY: number;
        totalAPY: number;
        rewards: {
            rewardMint: string | undefined;
            rewardSymbol: string;
            apy: number;
            price: number;
        }[];
    };
    private formatReserveData;
}
export declare type Position = {
    mintAddress: string;
    amount: BN;
};
export declare type ObligationStats = {
    liquidationThreshold: number;
    userTotalDeposit: number;
    userTotalBorrow: number;
    borrowLimit: number;
    borrowUtilization: number;
    netAccountValue: number;
    positions: number;
};
export declare class SolendObligation {
    walletAddress: PublicKey;
    obligationAddress: PublicKey;
    deposits: Array<Position>;
    borrows: Array<Position>;
    obligationStats: ObligationStats;
    constructor(walletAddress: PublicKey, obligationAddress: PublicKey, obligation: Obligation, reserves: Array<SolendReserve>);
    private calculatePositions;
}
export {};
