/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../../../../../common";
import type {
  Internal,
  InternalInterface,
} from "../../../../../../../@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Internal";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "encodedAddress",
        type: "bytes",
      },
    ],
    name: "InvalidEVMAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "ANY_2_EVM_MESSAGE_FIXED_BYTES",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ANY_2_EVM_MESSAGE_FIXED_BYTES_PER_TOKEN",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "CHAIN_FAMILY_SELECTOR_EVM",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "GAS_PRICE_BITS",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MESSAGE_FIXED_BYTES",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MESSAGE_FIXED_BYTES_PER_TOKEN",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PRECOMPILE_SPACE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x610283610053600b82828239805160001a607314610046577f4e487b7100000000000000000000000000000000000000000000000000000000600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600436106100875760003560e01c80637a4bb232116100655780637a4bb232146100e6578063dc47c58b14610104578063e5fb565214610122578063fb633e9c1461014057610087565b806318994e7a1461008c578063424fb7a7146100aa578063514abc10146100c8575b600080fd5b61009461015e565b6040516100a191906101a5565b60405180910390f35b6100b2610164565b6040516100bf91906101a5565b60405180910390f35b6100d061016a565b6040516100dd91906101a5565b60405180910390f35b6100ee610170565b6040516100fb91906101dc565b60405180910390f35b61010c610175565b60405161011991906101a5565b60405180910390f35b61012a61017b565b60405161013791906101a5565b60405180910390f35b610148610181565b6040516101559190610232565b60405180910390f35b61022081565b61012081565b6101c081565b607081565b61018081565b61040081565b632812d52c60e01b81565b6000819050919050565b61019f8161018c565b82525050565b60006020820190506101ba6000830184610196565b92915050565b600060ff82169050919050565b6101d6816101c0565b82525050565b60006020820190506101f160008301846101cd565b92915050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b61022c816101f7565b82525050565b60006020820190506102476000830184610223565b9291505056fea2646970667358221220039e56a1810f41edfe23840241430377faeeb7fe927980e014962aeaad5a977b64736f6c63430008180033";

type InternalConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: InternalConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Internal__factory extends ContractFactory {
  constructor(...args: InternalConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      Internal & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Internal__factory {
    return super.connect(runner) as Internal__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): InternalInterface {
    return new Interface(_abi) as InternalInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Internal {
    return new Contract(address, _abi, runner) as unknown as Internal;
  }
}
