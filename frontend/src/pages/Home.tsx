import React from 'react';
import { Link } from 'react-router-dom';

import ConnectWallet from '../connectwallet';

import './Home.css';

const HomePage: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column', // Align children vertically
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh', // Take full viewport height
            gap: '20px' // Creates space between child elements
        }}>
            <h1>Welcome to voteOnCCIP!</h1>
            <p>Please authenticate with Metamask and then click next</p>
            <ConnectWallet />
            <Link to="/ballot">
                <button>Navigate to Ballot</button>
            </Link>
        </div>
    );
};

export default HomePage;