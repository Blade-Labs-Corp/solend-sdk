import { Connection } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { TokenMetadata } from "../types";
export declare function formatWalletAssets(rawWalletData: Awaited<ReturnType<typeof fetchWalletAssets>>, metadata: TokenMetadata): import("../types").WalletAssetType[];
export declare function fetchWalletAssets(uniqueAssets: Array<string>, publicKey: string, connection: Connection, debug?: boolean): Promise<{
    userAssociatedTokenAccounts: (import("@solana/spl-token").Account | null)[];
    nativeSolBalance: BigNumber;
    wSolAddress: string;
}>;
