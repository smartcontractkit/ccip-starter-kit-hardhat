/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../../../../../../common";

export declare namespace Client {
  export type EVMTokenAmountStruct = {
    token: AddressLike;
    amount: BigNumberish;
  };

  export type EVMTokenAmountStructOutput = [token: string, amount: bigint] & {
    token: string;
    amount: bigint;
  };

  export type EVM2AnyMessageStruct = {
    receiver: BytesLike;
    data: BytesLike;
    tokenAmounts: Client.EVMTokenAmountStruct[];
    feeToken: AddressLike;
    extraArgs: BytesLike;
  };

  export type EVM2AnyMessageStructOutput = [
    receiver: string,
    data: string,
    tokenAmounts: Client.EVMTokenAmountStructOutput[],
    feeToken: string,
    extraArgs: string
  ] & {
    receiver: string;
    data: string;
    tokenAmounts: Client.EVMTokenAmountStructOutput[];
    feeToken: string;
    extraArgs: string;
  };

  export type Any2EVMMessageStruct = {
    messageId: BytesLike;
    sourceChainSelector: BigNumberish;
    sender: BytesLike;
    data: BytesLike;
    destTokenAmounts: Client.EVMTokenAmountStruct[];
  };

  export type Any2EVMMessageStructOutput = [
    messageId: string,
    sourceChainSelector: bigint,
    sender: string,
    data: string,
    destTokenAmounts: Client.EVMTokenAmountStructOutput[]
  ] & {
    messageId: string;
    sourceChainSelector: bigint;
    sender: string;
    data: string;
    destTokenAmounts: Client.EVMTokenAmountStructOutput[];
  };
}

export interface MockCCIPRouterInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "DEFAULT_GAS_LIMIT"
      | "GAS_FOR_CALL_EXACT_CHECK"
      | "ccipSend"
      | "getFee"
      | "getOnRamp"
      | "getSupportedTokens"
      | "isChainSupported"
      | "isOffRamp"
      | "routeMessage"
      | "setFee"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic: "MessageExecuted" | "MsgExecuted"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "DEFAULT_GAS_LIMIT",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "GAS_FOR_CALL_EXACT_CHECK",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "ccipSend",
    values: [BigNumberish, Client.EVM2AnyMessageStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "getFee",
    values: [BigNumberish, Client.EVM2AnyMessageStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "getOnRamp",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getSupportedTokens",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "isChainSupported",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "isOffRamp",
    values: [BigNumberish, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "routeMessage",
    values: [
      Client.Any2EVMMessageStruct,
      BigNumberish,
      BigNumberish,
      AddressLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "setFee",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "DEFAULT_GAS_LIMIT",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "GAS_FOR_CALL_EXACT_CHECK",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "ccipSend", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getFee", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getOnRamp", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getSupportedTokens",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isChainSupported",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "isOffRamp", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "routeMessage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setFee", data: BytesLike): Result;
}

export namespace MessageExecutedEvent {
  export type InputTuple = [
    messageId: BytesLike,
    sourceChainSelector: BigNumberish,
    offRamp: AddressLike,
    calldataHash: BytesLike
  ];
  export type OutputTuple = [
    messageId: string,
    sourceChainSelector: bigint,
    offRamp: string,
    calldataHash: string
  ];
  export interface OutputObject {
    messageId: string;
    sourceChainSelector: bigint;
    offRamp: string;
    calldataHash: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace MsgExecutedEvent {
  export type InputTuple = [
    success: boolean,
    retData: BytesLike,
    gasUsed: BigNumberish
  ];
  export type OutputTuple = [
    success: boolean,
    retData: string,
    gasUsed: bigint
  ];
  export interface OutputObject {
    success: boolean;
    retData: string;
    gasUsed: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface MockCCIPRouter extends BaseContract {
  connect(runner?: ContractRunner | null): MockCCIPRouter;
  waitForDeployment(): Promise<this>;

  interface: MockCCIPRouterInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  DEFAULT_GAS_LIMIT: TypedContractMethod<[], [bigint], "view">;

  GAS_FOR_CALL_EXACT_CHECK: TypedContractMethod<[], [bigint], "view">;

  ccipSend: TypedContractMethod<
    [
      destinationChainSelector: BigNumberish,
      message: Client.EVM2AnyMessageStruct
    ],
    [string],
    "payable"
  >;

  getFee: TypedContractMethod<
    [arg0: BigNumberish, arg1: Client.EVM2AnyMessageStruct],
    [bigint],
    "view"
  >;

  getOnRamp: TypedContractMethod<[arg0: BigNumberish], [string], "view">;

  getSupportedTokens: TypedContractMethod<
    [arg0: BigNumberish],
    [string[]],
    "view"
  >;

  isChainSupported: TypedContractMethod<
    [arg0: BigNumberish],
    [boolean],
    "view"
  >;

  isOffRamp: TypedContractMethod<
    [arg0: BigNumberish, arg1: AddressLike],
    [boolean],
    "view"
  >;

  routeMessage: TypedContractMethod<
    [
      message: Client.Any2EVMMessageStruct,
      gasForCallExactCheck: BigNumberish,
      gasLimit: BigNumberish,
      receiver: AddressLike
    ],
    [
      [boolean, string, bigint] & {
        success: boolean;
        retData: string;
        gasUsed: bigint;
      }
    ],
    "nonpayable"
  >;

  setFee: TypedContractMethod<[feeAmount: BigNumberish], [void], "nonpayable">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "DEFAULT_GAS_LIMIT"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "GAS_FOR_CALL_EXACT_CHECK"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "ccipSend"
  ): TypedContractMethod<
    [
      destinationChainSelector: BigNumberish,
      message: Client.EVM2AnyMessageStruct
    ],
    [string],
    "payable"
  >;
  getFunction(
    nameOrSignature: "getFee"
  ): TypedContractMethod<
    [arg0: BigNumberish, arg1: Client.EVM2AnyMessageStruct],
    [bigint],
    "view"
  >;
  getFunction(
    nameOrSignature: "getOnRamp"
  ): TypedContractMethod<[arg0: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "getSupportedTokens"
  ): TypedContractMethod<[arg0: BigNumberish], [string[]], "view">;
  getFunction(
    nameOrSignature: "isChainSupported"
  ): TypedContractMethod<[arg0: BigNumberish], [boolean], "view">;
  getFunction(
    nameOrSignature: "isOffRamp"
  ): TypedContractMethod<
    [arg0: BigNumberish, arg1: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "routeMessage"
  ): TypedContractMethod<
    [
      message: Client.Any2EVMMessageStruct,
      gasForCallExactCheck: BigNumberish,
      gasLimit: BigNumberish,
      receiver: AddressLike
    ],
    [
      [boolean, string, bigint] & {
        success: boolean;
        retData: string;
        gasUsed: bigint;
      }
    ],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setFee"
  ): TypedContractMethod<[feeAmount: BigNumberish], [void], "nonpayable">;

  getEvent(
    key: "MessageExecuted"
  ): TypedContractEvent<
    MessageExecutedEvent.InputTuple,
    MessageExecutedEvent.OutputTuple,
    MessageExecutedEvent.OutputObject
  >;
  getEvent(
    key: "MsgExecuted"
  ): TypedContractEvent<
    MsgExecutedEvent.InputTuple,
    MsgExecutedEvent.OutputTuple,
    MsgExecutedEvent.OutputObject
  >;

  filters: {
    "MessageExecuted(bytes32,uint64,address,bytes32)": TypedContractEvent<
      MessageExecutedEvent.InputTuple,
      MessageExecutedEvent.OutputTuple,
      MessageExecutedEvent.OutputObject
    >;
    MessageExecuted: TypedContractEvent<
      MessageExecutedEvent.InputTuple,
      MessageExecutedEvent.OutputTuple,
      MessageExecutedEvent.OutputObject
    >;

    "MsgExecuted(bool,bytes,uint256)": TypedContractEvent<
      MsgExecutedEvent.InputTuple,
      MsgExecutedEvent.OutputTuple,
      MsgExecutedEvent.OutputObject
    >;
    MsgExecuted: TypedContractEvent<
      MsgExecutedEvent.InputTuple,
      MsgExecutedEvent.OutputTuple,
      MsgExecutedEvent.OutputObject
    >;
  };
}
