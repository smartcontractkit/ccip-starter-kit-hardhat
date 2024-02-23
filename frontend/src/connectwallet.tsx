// ConnectWallet.tsx
import React from 'react';
import { ethers } from 'ethers';
import './connectwallet.css';
declare global {
    interface Window {
      ethereum: any;
    }
  }

const ConnectWallet: React.FC = () => {
  // Function to connect to the user's MetaMask wallet
  const connectWalletHandler = async () => {
    // Check if MetaMask is installed
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Use the first account
        const account = accounts[0];
        console.log('Connected account:', account);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this feature.');
    }
  };

  return (
    <button onClick={connectWalletHandler}>Connect to MetaMask</button>
  );
};

export default ConnectWallet;
