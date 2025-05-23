/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IGetCCIPAdmin,
  IGetCCIPAdminInterface,
} from "../../../../../@chainlink/contracts-ccip/contracts/interfaces/IGetCCIPAdmin";

const _abi = [
  {
    inputs: [],
    name: "getCCIPAdmin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class IGetCCIPAdmin__factory {
  static readonly abi = _abi;
  static createInterface(): IGetCCIPAdminInterface {
    return new Interface(_abi) as IGetCCIPAdminInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IGetCCIPAdmin {
    return new Contract(address, _abi, runner) as unknown as IGetCCIPAdmin;
  }
}
