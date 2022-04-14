export declare type ConfigType = {
    programID: string;
    assets: AssetType[];
    oracles: OraclesType;
    markets: MarketType[];
};
export declare type AssetType = {
    name: string;
    symbol: string;
    decimals: number;
    mintAddress: string;
};
export declare type OraclesType = {
    pythProgramID: string;
    switchboardProgramID: string;
    assets: OracleAssetType[];
};
export declare type OracleAssetType = {
    asset: string;
    priceAddress: string;
    switchboardFeedAddress: string;
};
export declare type MarketType = {
    name: string;
    address: string;
    authorityAddress: string;
    reserves: ReserveType[];
    isPrimary: boolean;
};
export declare type ReserveType = {
    asset: string;
    address: string;
    collateralMintAddress: string;
    collateralSupplyAddress: string;
    liquidityAddress: string;
    liquidityFeeReceiverAddress: string;
    userSupplyCap?: number;
};
export declare type EnviromentConfig = "production" | "devnet" | ConfigType;
