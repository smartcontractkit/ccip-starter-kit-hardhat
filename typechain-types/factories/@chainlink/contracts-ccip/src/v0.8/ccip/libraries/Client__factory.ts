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
  Client,
  ClientInterface,
} from "../../../../../../../@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client";

const _abi = [
  {
    inputs: [],
    name: "EVM_EXTRA_ARGS_V1_TAG",
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
    name: "EVM_EXTRA_ARGS_V2_TAG",
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
    name: "SVM_EXTRA_ARGS_MAX_ACCOUNTS",
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
    name: "SVM_EXTRA_ARGS_V1_TAG",
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
] as const;

const _bytecode =
  "0x6101b9610053600b82828239805160001a607314610046577f4e487b7100000000000000000000000000000000000000000000000000000000600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600436106100565760003560e01c80631ac428f81461005b5780633ab8c0d0146100795780638113c57814610097578063a5dd87d8146100b5575b600080fd5b6100636100d3565b6040516100709190610112565b60405180910390f35b6100816100d8565b60405161008e9190610168565b60405180910390f35b61009f6100e3565b6040516100ac9190610168565b60405180910390f35b6100bd6100ee565b6040516100ca9190610168565b60405180910390f35b604081565b6397a657c960e01b81565b63181dcf1060e01b81565b631f3b3aba60e01b81565b6000819050919050565b61010c816100f9565b82525050565b60006020820190506101276000830184610103565b92915050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b6101628161012d565b82525050565b600060208201905061017d6000830184610159565b9291505056fea2646970667358221220f2eea817be021d997d3f644ff50b48529358610b7879254c0591f0be22ff218164736f6c63430008180033";

type ClientConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ClientConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Client__factory extends ContractFactory {
  constructor(...args: ClientConstructorParams) {
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
      Client & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Client__factory {
    return super.connect(runner) as Client__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ClientInterface {
    return new Interface(_abi) as ClientInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Client {
    return new Contract(address, _abi, runner) as unknown as Client;
  }
}
