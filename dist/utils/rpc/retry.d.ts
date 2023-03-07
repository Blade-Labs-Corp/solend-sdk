/// <reference types="node" />
import { AccountInfo, AddressLookupTableAccount, Blockhash, BlockhashWithExpiryBlockHeight, BlockheightBasedTransactionConfirmationStrategy, Commitment, ConfirmedSignatureInfo, ConfirmedSignaturesForAddress2Options, FeeCalculator, Finality, GetAccountInfoConfig, GetLatestBlockhashConfig, GetMultipleAccountsConfig, GetProgramAccountsConfig, GetSlotConfig, GetTransactionConfig, PublicKey, RpcResponseAndContext, SendOptions, SignatureResult, SimulatedTransactionResponse, SimulateTransactionConfig, TokenAmount, TransactionResponse, TransactionSignature, VersionedTransaction } from "@solana/web3.js";
import { SolendRPCConnection } from "./interface";
export declare class RetryConnection implements SolendRPCConnection {
    connection: SolendRPCConnection;
    maxRetries: number;
    rpcEndpoint: string;
    constructor(connection: SolendRPCConnection, maxRetries?: number);
    getAccountInfo(publicKey: PublicKey, commitmentOrConfig?: Commitment | GetAccountInfoConfig): Promise<AccountInfo<Buffer> | null>;
    getConfirmedSignaturesForAddress2(address: PublicKey, options?: ConfirmedSignaturesForAddress2Options, commitment?: Finality): Promise<Array<ConfirmedSignatureInfo>>;
    getLatestBlockhash(commitmentOrConfig?: Commitment | GetLatestBlockhashConfig): Promise<BlockhashWithExpiryBlockHeight>;
    getMultipleAccountsInfo(publicKeys: PublicKey[], commitmentOrConfig?: Commitment | GetMultipleAccountsConfig): Promise<(AccountInfo<Buffer> | null)[]>;
    getProgramAccounts(programId: PublicKey, configOrCommitment?: GetProgramAccountsConfig | Commitment): Promise<Array<{
        pubkey: PublicKey;
        account: AccountInfo<Buffer>;
    }>>;
    getRecentBlockhash(commitment?: Commitment): Promise<{
        blockhash: Blockhash;
        feeCalculator: FeeCalculator;
    }>;
    getSlot(commitmentOrConfig?: Commitment | GetSlotConfig): Promise<number>;
    getTokenAccountBalance(tokenAddress: PublicKey, commitment?: Commitment): Promise<RpcResponseAndContext<TokenAmount>>;
    getTokenSupply(tokenMintAddress: PublicKey, commitment?: Commitment): Promise<RpcResponseAndContext<TokenAmount>>;
    getTransaction(signature: string, rawConfig?: GetTransactionConfig): Promise<TransactionResponse | null>;
    sendTransaction(transaction: VersionedTransaction, options?: SendOptions): Promise<TransactionSignature>;
    simulateTransaction(transaction: VersionedTransaction, config?: SimulateTransactionConfig): Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;
    getAddressLookupTable(accountKey: PublicKey, config?: GetAccountInfoConfig): Promise<RpcResponseAndContext<AddressLookupTableAccount | null>>;
    confirmTransaction(strategy: BlockheightBasedTransactionConfirmationStrategy, commitment?: Commitment): Promise<RpcResponseAndContext<SignatureResult>>;
    withRetries(fn: Promise<any>): Promise<any>;
}
