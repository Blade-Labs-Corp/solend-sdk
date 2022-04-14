import { BNumber } from "./common";
import { Reserve } from "../state/reserve";
declare type RewardPoolStat = {
    rewardsPerShare: string;
    totalBalance: string;
    lastSlot: number;
    side: string;
    tokenMint: string;
    rewardRates: Array<{
        beginningSlot: number;
        rewardRate: string;
    }>;
};
declare type RewardPoolResponse = {
    [mint: string]: {
        borrow: RewardPoolStat;
        supply: RewardPoolStat;
    };
};
declare const loadReserve: (symbol: string, rpcEndpoint?: string) => Promise<Reserve>;
export declare const calculateUtilizationRatio: (reserve: Reserve) => BNumber;
export declare const calculateBorrowAPY: (reserve: Reserve) => BNumber;
export declare function loadTokensOracleData(priceAddresses: Array<string>, rpcEndpoint?: string): Promise<Array<number>>;
export declare const calculateSupplyAPY: (reserve: Reserve) => BNumber;
export declare const calculateRewardApy: (mintAddress: string, price: number, side: "borrow" | "supply", slot: number, poolAssetPrice: BNumber, poolAssetDecimals: number, data: RewardPoolResponse) => BNumber;
export declare const calculateMarinadeData: (rpcEndpoint?: string) => Promise<{
    tvl: string;
    totalApy: string;
    dailySlndEmission: string;
    dailyMndeEmission: string;
}>;
export default loadReserve;
