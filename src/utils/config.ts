import {Connection, PublicKey} from "@solana/web3.js";
import {ConfigType, CustomEnviromentConfigType, MarketConfigType} from "../classes";
import base58 from "bs58";

export type LendingReserveData = {
	reserve: PublicKey,
	name: string,
	symbol: string,
	decimals: number
};
// TODO: Maybe have some proper schema-based decoding in place instead of slicing buffers up manually
const reserveOffsets = {
	marketAddr: 10,
	tokenMintAddress: 42,
	liquidityAddress: 75,
	pythAddress: 107,
	switchboardAddress: 139,
	collateralMintAddress: 227,
	collateralSupplyAddress: 267,
	depositLimit: 323,
	borrowLimit: 331,
	liquidityFeeReceiverAddress: 339
};

export async function generateCustomEnviromentConfig(
	connection: Connection,
	marketName: string,
	marketDescription: string,
	reserveAccountData: LendingReserveData[]
): Promise<CustomEnviromentConfigType> {
	let {owner: lendingProgram, data} = (await connection.getAccountInfo(reserveAccountData[0].reserve))!;
	const lendingMarketAcc = new PublicKey(data.subarray(10, 10 + 32));
	data = (await connection.getAccountInfo(lendingMarketAcc))!.data;
	let i = 0; // marketVersion
	const marketAuthBumpSeed = data[i += 1]; // marketBumpSeed
	i += 32; // marketOwner
	i += 32; // quoteCurrencyRaw
	i += 32; // marketTokenProgramId
	const pythProgramId = new PublicKey(data.subarray(i, i += 32));
	const switchboardProgramId = new PublicKey(data.subarray(i, i += 32));

	const marketAuthority = await PublicKey.createProgramAddress(
		[lendingMarketAcc.toBuffer(), Buffer.from([marketAuthBumpSeed])],
		lendingProgram
	);
	const marketConfig: MarketConfigType = {
		name: marketName,
		isPrimary: false,
		description: marketDescription,
		creator: "nu11111111111111111111111111111111111111111", // doesn't matter right now
		address: lendingMarketAcc.toBase58(),
		hidden: false,
		authorityAddress: marketAuthority.toBase58(),
		reserves: []
	}
	for(i = 0; i < reserveAccountData.length; i += 1){
		const reserveAccData = reserveAccountData[i];
		const {data: reserveData} = (await connection.getAccountInfo(reserveAccData.reserve))!;
		marketConfig.reserves.push(
			{
				liquidityToken: {
					mint: base58.encode(
						reserveData.subarray(
							reserveOffsets.tokenMintAddress,
							reserveOffsets.tokenMintAddress + 32
						)
					),
					name: reserveAccData.name,
					symbol: reserveAccData.symbol,
					decimals: reserveAccData.decimals,
					// Not important for what we're using a custom env for
					coingeckoID: "",
					logo: "",
					// No idea why this is defined as a number when the API returns a string
					volume24h: 1
				},
				address: reserveAccData.reserve.toBase58(),
				pythOracle: base58.encode(
					reserveData.subarray(
						reserveOffsets.pythAddress,
						reserveOffsets.pythAddress + 32
					)
				),
				switchboardOracle: base58.encode(
					reserveData.subarray(
						reserveOffsets.switchboardAddress,
						reserveOffsets.switchboardAddress + 32
					)
				),
				collateralMintAddress: base58.encode(
					reserveData.subarray(
						reserveOffsets.collateralMintAddress,
						reserveOffsets.collateralMintAddress + 32
					)
				),
				collateralSupplyAddress: base58.encode(
					reserveData.subarray(
						reserveOffsets.collateralSupplyAddress,
						reserveOffsets.collateralSupplyAddress + 32
					)
				),
				liquidityAddress: base58.encode(
					reserveData.subarray(
						reserveOffsets.liquidityAddress,
						reserveOffsets.liquidityAddress + 32
					)
				),
				liquidityFeeReceiverAddress: base58.encode(
					reserveData.subarray(
						reserveOffsets.liquidityFeeReceiverAddress,
						reserveOffsets.liquidityFeeReceiverAddress + 32
					)
				),
				// No idea why these are numbers when the API returns strings
				userBorrowCap: Number(
					reserveData.readBigUInt64LE(reserveOffsets.borrowLimit)
				),
				userSupplyCap: Number(
					reserveData.readBigUInt64LE(reserveOffsets.depositLimit)
				)
			}
		)
	}
	return {
		pythProgramID: pythProgramId.toBase58(),
		switchboardProgramID: switchboardProgramId.toBase58(),
		programID: lendingProgram.toBase58(),
		marketConfigs: [marketConfig]
	};
};
