require("dotenv").config();
const algosdk = require("algosdk");

const kmdClient = new algosdk.Kmd(
    process.env.KMD_TOKEN,
    process.env.KMD_ADDRESS,
    process.env.KMD_PORT
)

const algoClient = new algosdk.Algodv2(
    process.env.ALGO_TOKEN,
    process.env.ALGO_ADDRESS,
    process.env.ALGO_PORT,
)


const main = async () => {
    // list wallets
    const { wallets } = await kmdClient.listWallets();
    const defaultWallet = wallets[0];

    // get default wallet
    const wallethandle = await kmdClient.initWalletHandle(defaultWallet.id);


    // generate account from wallet
    const address = (await kmdClient.generateKey(wallethandle.wallet_handle_token)).address;

    // account info via algod
    console.log(await  algoClient.accountInformation(address).do())

}

main().catch(console.error);