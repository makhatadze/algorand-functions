require('dotenv').config();
const algosdk = require('algosdk');


const algoClient = new algosdk.Algodv2(
    process.env.ALGO_TOKEN,
    process.env.ALGO_ADDRESS,
    process.env.ALGO_PORT,
)

const main = async () => {
    console.log(await algoClient.status().do())
}

main().catch(console.error);