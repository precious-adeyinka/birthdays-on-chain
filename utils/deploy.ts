import { keccak256, toUtf8Bytes } from "ethers";
import fs from "fs";
import path from "path";

// Function to get selectors from ABI
const getSelectors = (contractName: string) => {
  try {
    const contractABIPath = path.join(__dirname, `../artifacts/contracts/facets/${contractName}.sol/${contractName}.json`);
    const contractJSON = JSON.parse(fs.readFileSync(contractABIPath, 'utf-8'));
    const abi = contractJSON.abi;  // Get the ABI from the contract's JSON file
  
    // Filter out only function fragments from the ABI
    const fragments = abi.filter((item: any) => item.type === 'function');
  
    // Generate selectors using the full function signature
    const selectors = fragments.map((fragment: any) => {
      const signature = `${fragment.name}(${fragment.inputs.map((input: any) => input.type).join(',')})`;
      return keccak256(toUtf8Bytes(signature)).slice(0, 10);  // Get the first 4 bytes
    });
  
    return selectors;
  }
  catch(err) {
    console.log(err)
    throw err
  }
};

// Facet Cut Action Enum
const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2,
};

const ZERO_ADDRESS = `0x${"0".repeat(40)}`

export { getSelectors, FacetCutAction, ZERO_ADDRESS };