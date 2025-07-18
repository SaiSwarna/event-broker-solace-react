import React, { useEffect, useState } from 'react';
import { initSolaceClient, publishMessage, subscribeToTopic } from './SolaceClient.js';
import './App.css';

function App() {
    const [orderId, setOrderId] = useState('');
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        initSolaceClient()
            .then((session) => {
                try {
                    subscribeToTopic('payment/confirmed', (message) => {
                        // Stringify JSON objects for display
                        const displayMessage = typeof message === 'object' ? JSON.stringify(message) : message;
                        setMessages((prev) => [...prev, displayMessage]);
                    });
                } catch (err) {
                    setError('Failed to subscribe: ' + err.message);
                }
            })
            .catch((err) => {
                setError('Failed to initialize Solace: ' + err.message);
            });
    }, []);

    const handlePublish = () => {
        if (orderId) {
            try {
                publishMessage('order/created', JSON.stringify({ orderId }));
                setOrderId('');
            } catch (err) {
                setError('Failed to publish: ' + err.message);
            }
        }
    };

    return (
        <div className="App">
            <h1>Solace POC</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
                <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter Order ID"
                />
                <button onClick={handlePublish}>Publish Order</button>
            </div>
            <h2>Received Payments</h2>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;