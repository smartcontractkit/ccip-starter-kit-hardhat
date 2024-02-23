// src/App.js
import React, { useState } from 'react';
import './App.css'; // Import the CSS file

const MyForm = () => {
  const [message, setMessage] = useState('');

  const handleInputChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setMessage(e.target.value);
  };

  const handleSubmit = () => {
    console.log('Message submitted:', message);
  };

  return (
    <div className="my-form-container"> {/* Apply a class for styling */}
      <h2>What would you like to send today?</h2>
      <label>
        Enter here:
        <input type="text" value={message} onChange={handleInputChange} />
      </label>
      <button onClick={handleSubmit}>Submit to Chain</button>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <MyForm />
    </div>
  );
}

export default App;
