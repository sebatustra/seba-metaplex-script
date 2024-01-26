import {
    Metaplex,
    toMetaplexFile,
    NftWithToken,
  } from "@metaplex-foundation/js"
import * as fs from "fs";
import * as web3 from "@solana/web3.js";

interface NftData {
    name: string
    symbol: string
    description: string
    sellerFeeBasisPoints: number
    imageFile: string
}
  
interface CollectionNftData {
    name: string
    symbol: string
    description: string
    sellerFeeBasisPoints: number
    imageFile: string
    isCollection: boolean
    collectionAuthority: web3.Signer
}

export class MetaplexCoordinator {
    readonly metaplex: Metaplex;

    constructor(metaplex: Metaplex) {
        this.metaplex = metaplex;
    }

    async uploadMetadata(
        nftData: NftData
    ): Promise<string> {
        const buffer = fs.readFileSync("src/" + nftData.imageFile);

        const file = toMetaplexFile(buffer, nftData.imageFile);

        const imageUri = await this.metaplex.storage().upload(file);
        console.log("image uri: ", imageUri);

        const { uri } = await this.metaplex.nfts().uploadMetadata({
            name: nftData.name,
            symbol: nftData.symbol,
            description: nftData.description,
            image: imageUri
        });
        console.log("metadata uri: ", uri);
        
        return uri
    }

    async createNft(
        uri: string,
        nftData: NftData,
        collectionMint?: web3.PublicKey
    ): Promise<NftWithToken> {

        const normalInput = {
            uri: uri,
            name: nftData.name,
            sellerFeeBasisPoints: nftData.sellerFeeBasisPoints,
            symbol: nftData.symbol,
        };

        const collectionInput = {
            uri: uri,
            name: nftData.name,
            sellerFeeBasisPoints: nftData.sellerFeeBasisPoints,
            symbol: nftData.symbol,
            collection: collectionMint
        };

        const { nft } = await this.metaplex.nfts().create(
            collectionMint ? collectionInput : normalInput,
            { commitment: "finalized" }
        );

        console.log(
            `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
        );

        if (collectionMint) {
            await this.metaplex.nfts().verifyCollection({
                mintAddress: nft.mint.address,
                collectionMintAddress: collectionMint,
                isSizedCollection: true
            })
        }

        return nft;
    }

    async updateNftUri(
       uri: string,
       mintAddress: web3.PublicKey
    ) {
        const nft = await this.metaplex.nfts().findByMint({ mintAddress });

        const { response } = await this.metaplex.nfts().update(
            {
                nftOrSft: nft,
                uri: uri
            },
            { commitment: "finalized" }
        );

        console.log(
            `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
        );

        console.log(
            `Transaction: https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
        );
    }

    async createCollectionNft(
        uri: string,
        data: CollectionNftData
    ): Promise<NftWithToken> {
        const { nft } = await this.metaplex.nfts().create(
            {
                uri: uri,
                name: data.name,
                sellerFeeBasisPoints: data.sellerFeeBasisPoints,
                symbol: data.symbol,
                isCollection: true,
            },
            { commitment: "finalized" }
        );

        console.log(
            `Collection Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
        );

        return nft
    }

}