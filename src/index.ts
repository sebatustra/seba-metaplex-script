import { initializeKeypair } from "./initializeKeypair";
import * as web3 from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js";
import { MetaplexCoordinator } from "./metaplexCoordinator";
import dotenv from "dotenv";
dotenv.config();

  // example data for a new NFT
const nftData = {
    name: "Name",
    symbol: "SYMBOL",
    description: "Description",
    sellerFeeBasisPoints: 0,
    imageFile: "solana.png",
}

  // example data for updating an existing NFT
const updateNftData = {
    name: "Update",
    symbol: "UPDATE",
    description: "Update Description",
    sellerFeeBasisPoints: 100,
    imageFile: "success.png",
}

async function main() {

  const connection = new web3.Connection(process.env.HELIUS_URL || web3.clusterApiUrl("devnet"));

  const user = await initializeKeypair(connection);

  console.log("PublicKey:", user.publicKey.toBase58());

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
        bundlrStorage({
            address: "https://devnet.bundlr.network",
            providerUrl: "https://api.devnet.solana.com",
            timeout: 60000,
        }),
    );

    const coordinator = new MetaplexCoordinator(metaplex);

    const uri = await coordinator.uploadMetadata(nftData);

    const nft = await coordinator.createNft(uri, nftData);

    const updatedUri = await coordinator.uploadMetadata(updateNftData);

    await coordinator.updateNftUri(updatedUri, nft.address);

    const collectionNftData = {
        name: "TestCollectionNFT",
        symbol: "TEST",
        description: "Test Description Collection",
        sellerFeeBasisPoints: 100,
        imageFile: "success.png",
        isCollection: true,
        collectionAuthority: user,
    };

    const collectionUri = await coordinator.uploadMetadata(collectionNftData);

    const collectionNft = await coordinator.createCollectionNft(collectionUri, collectionNftData);

    const collectedUri = await coordinator.uploadMetadata(nftData);

    const collectedNft = await coordinator.createNft(collectedUri, nftData, collectionNft.mint.address);

    
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
