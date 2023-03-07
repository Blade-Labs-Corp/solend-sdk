import { Connection, PublicKey } from "@solana/web3.js";
import { EnvironmentType } from "../../index";
import { PoolMetadataCoreType } from "../../index";
export declare function fetchPoolMetadata(connection: Connection, environment?: EnvironmentType, useApi?: Boolean, debug?: Boolean, customProgramId?: PublicKey): Promise<Array<PoolMetadataCoreType>>;
export declare const fetchPoolMetadataFromChain: (connection: Connection, programId: PublicKey, debug?: Boolean) => Promise<{
    name: null;
    owner: string;
    authorityAddress: string;
    address: string;
}[]>;
