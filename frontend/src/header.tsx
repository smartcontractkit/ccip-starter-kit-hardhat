import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ onConnectWallet }: { onConnectWallet: () => void }) => {
    return (
        <header>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/ballot">Ballot</Link>
            </nav>
            <button onClick={onConnectWallet}>Connect Wallet</button>
        </header>
    );
};

export default Header;