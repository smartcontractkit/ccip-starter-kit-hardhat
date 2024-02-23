import { ethers } from "hardhat";

async function main() {
    // The addresses should be replaced with the actual addresses for your project
    const linkTokenAddress = "your_LINK_token_contract_address_here";
    const routerAddress = "your_router_contract_address_here";

    const Sender = await ethers.getContractFactory("Sender");
    const sender = await Sender.deploy(linkTokenAddress, routerAddress);

    await sender.deployed();

    console.log("Sender deployed to:", sender.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });



    