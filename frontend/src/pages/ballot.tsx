import React, { useState, FormEvent } from 'react';
import './ballot.css';

const Election: React.FC = () => {
  // State to track the selected option
  const [selectedOption, setSelectedOption] = useState<string>('');

  // Function to handle option change
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  // Function to handle the vote submission
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (selectedOption) {
      alert(`You have voted for: ${selectedOption}`);
      // Here you would typically send the vote to a backend service or blockchain
    } else {
      alert('Please select an option to vote.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column', // Align children vertically
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh', // Take full viewport height
      gap: '20px' // Creates space between child elements
  }}>
      <h2>Election Voting</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <input
              type="radio"
              value="Option 1"
              checked={selectedOption === 'Option 1'}
              onChange={handleOptionChange}
            />
            Option 1
          </label>
        </div>
        
        <div>
          <label>
            <input
              type="radio"
              value="Option 2"
              checked={selectedOption === 'Option 2'}
              onChange={handleOptionChange}
            />
            Option 2
          </label>
        </div>
        
        <button type="submit">Vote</button>
      </form>
    </div>
  );
};

export default Election;
