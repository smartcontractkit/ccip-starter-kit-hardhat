declare module "@chainlink/local/scripts/CCIPLocalSimulatorFork" {
  /**
   * Requests LINK tokens from the faucet and returns the transaction hash
   *
   * @param linkAddress The address of the LINK contract on the current network
   * @param to The address to send LINK to
   * @param amount The amount of LINK to request
   * @returns Promise resolving to the transaction hash of the fund transfer
   */
  export function requestLinkFromTheFaucet(
    linkAddress: string,
    to: string,
    amount: bigint
  ): Promise<string>;

  /**
   * Parses a transaction receipt to extract the sent message
   * Scans through transaction logs to find a `CCIPSendRequested` event and then decodes it to an object
   *
   * @param receipt - The transaction receipt from the `ccipSend` call
   * @returns Returns either the sent message or null if provided receipt does not contain `CCIPSendRequested` log
   */
  export function getEvm2EvmMessage(receipt: any): Evm2EvmMessage | null;

  /**
   * Routes the sent message from the source network on the destination (current) network
   *
   * @param routerAddress - Address of the destination Router
   * @param evm2EvmMessage - Sent cross-chain message
   * @returns Either resolves with no value if the message is successfully routed, or reverts
   * @throws Fails if no off-ramp matches the message's source chain selector or if calling `router.getOffRamps()`
   */
  export function routeMessage(
    routerAddress: string,
    evm2EvmMessage: Evm2EvmMessage
  ): Promise<void>;

  export interface Evm2EvmMessage {
    sourceChainSelector: bigint;
    sender: string;
    receiver: string;
    sequenceNumber: bigint;
    gasLimit: bigint;
    strict: boolean;
    nonce: bigint;
    feeToken: string;
    feeTokenAmount: bigint;
    data: string;
    tokenAmounts: Array<{ token: string; amount: bigint }>;
    sourceTokenData: Array<string>;
    messageId: string;
  }
}
