require("dotenv").config();
const algosdk = require("algosdk");


const algoClient = new algosdk.Algodv2(
    process.env.ALGO_TOKEN,
    process.env.ALGO_ADDRESS,
    process.env.ALGO_PORT,
)


const submitToNetwork = async (signedTxn) => {
    // send txn
    let tx = await algoClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction : " + tx.txId);

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algoClient, tx.txId, 4);

    console.log(
        "Transaction " +
        tx.txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    )
    return confirmedTxn;
}

const sendAlgos = async (sender, receiver, amount) => {
    // create suggested parameters
    const suggestedParams = await algoClient.getTransactionParams().do();
    let txn = algosdk.makePaymentTxnWithSuggestedParams(
        sender.addr,
        receiver.addr,
        amount,
        undefined,
        undefined,
        suggestedParams
    )

    // sign the transaction
    const signedTxn = txn.signTxn(sender.sk);

    const confirmedTxn = await submitToNetwork(signedTxn);
}

(async () => {
    // Account A
    let myAccountA = algosdk.generateAccount();
    console.log("My account A address: %s", myAccountA.addr);

    // Account B
    let myAccountB = algosdk.generateAccount();
    console.log("My account B address: %s", myAccountB.addr);

    // Account C
    let myAccountC = algosdk.generateAccount();
    console.log("My account C address: %s", myAccountC.addr);

    // Creator
    const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);

    // Fund all accounts with 1 algo
    await sendAlgos(creator, myAccountA, 1e6);
    await sendAlgos(creator, myAccountB, 1e6);
    await sendAlgos(creator, myAccountC, 1e6);

    // create multsig account creating B and C
    let multisigParams = {
        version: 1,
        threshold: 1,
        addrs: [
            myAccountB.addr,
            myAccountC.addr
        ]
    }

    let multsigaddr = algosdk.multisigAddress(multisigParams);
    console.log("Multisig Address: " + multsigaddr);

    // Rekey account A to Multisig address
    let params = await algoClient.getTransactionParams().do();

    let txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: myAccountA.addr,
        to: myAccountA.addr,
        amount: 0,
        suggestedParams: params,
        rekeyTo: multsigaddr
    });

    let signedTxn = txn.signTxn(myAccountA.sk);
    await submitToNetwork(signedTxn);

    // Send Algos from A to B
    console.log("Sending algos from A to B...");
    let payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: myAccountA.addr,
        to: myAccountB.addr,
        amount: 1e5, // 0.1 algos
        suggestedParams: params
    })

    // Try to submit txn by A
    // let wrongTxn = payTxn.signTxn(myAccountA.sk);
    // await submitToNetwork(wrongTxn)

    // Txn can be signed by B or C
    let mSignedTxn = algosdk.signMultisigTransaction(payTxn, multisigParams, myAccountB.sk)
    await submitToNetwork(mSignedTxn.blob);

    // Check your work
    console.log("Account A balance: ", (await algoClient.accountInformation(myAccountA.addr).do()))
    console.log("Account B balance: ", (await algoClient.accountInformation(myAccountB.addr).do()))
})();