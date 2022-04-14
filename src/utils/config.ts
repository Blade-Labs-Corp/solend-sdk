import {Connection, PublicKey} from "@solana/web3.js";
import {ConfigType} from "../classes";
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
	liquidityFeeReceiverAddress: 339
};

export async function generateConfig(
	connection: Connection,
	marketName: string,
	reserveAccountData: LendingReserveData[]
): Promise<ConfigType> {
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

	const config: ConfigType = {
		programID: lendingProgram.toBase58(),
		assets: [],
		markets: [{
			name: marketName,
			isPrimary: true,
			address: lendingMarketAcc.toBase58(),
			authorityAddress: marketAuthority.toBase58(),
			reserves: []
		}],
		oracles: {
			pythProgramID: pythProgramId.toBase58(),
			switchboardProgramID: switchboardProgramId.toBase58(),
			assets: []
		}
	};
	const assets = config.assets;
	const reserves = config.markets[0].reserves;
	const oracleAssets = config.oracles.assets;
	for(i = 0; i < reserveAccountData.length; i += 1){
		const reserveAccData = reserveAccountData[i];
		const {data: reserveData} = (await connection.getAccountInfo(reserveAccData.reserve))!;
		assets.push({
			name: reserveAccData.name,
			symbol: reserveAccData.symbol,
			decimals: reserveAccData.decimals,
			mintAddress: base58.encode(
				reserveData.subarray(
					reserveOffsets.tokenMintAddress,
					reserveOffsets.tokenMintAddress + 32
				)
			)
		});
		reserves.push({
			asset: reserveAccData.symbol,
			address: reserveAccData.reserve.toBase58(),
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
			)
		});
		oracleAssets.push({
			asset: reserveAccData.symbol,
			priceAddress: base58.encode(
				reserveData.subarray(
					reserveOffsets.pythAddress,
					reserveOffsets.pythAddress + 32
				)
			),
			switchboardFeedAddress: base58.encode(
				reserveData.subarray(
					reserveOffsets.switchboardAddress,
					reserveOffsets.switchboardAddress + 32
				)
			)
		});
	}
	return config;
};
