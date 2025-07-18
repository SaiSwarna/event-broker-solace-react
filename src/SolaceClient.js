import * as solace from 'solclientjs';

let session = null;

export const initSolaceClient = () => {
    return new Promise((resolve, reject) => {
        const factoryProps = new solace.SolclientFactoryProperties();
        factoryProps.profile = solace.SolclientFactoryProfiles.version10_5;
        solace.SolclientFactory.init(factoryProps);

        const sessionProperties = new solace.SessionProperties({
            url: 'wss://mr-connection-s2or6apnkae.messaging.solace.cloud:443',
            vpnName: 'mysamplebroker',
            userName: 'solace-cloud-client',
            password: 'v71sl5t7j7q73m71jk899vealf',
        });

        session = solace.SolclientFactory.createSession(sessionProperties);

        session.on(solace.SessionEventCode.UP_NOTICE, () => {
            console.log('Solace session connected');
            resolve(session);
        });

        session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (error) => {
            console.error('Solace connection failed:', error);
            reject(new Error('Connection failed: ' + error.message));
        });

        session.on(solace.SessionEventCode.DISCONNECTED, () => {
            console.log('Solace session disconnected');
            session = null;
        });

        try {
            session.connect();
        } catch (err) {
            reject(err);
        }
    });
};

export const publishMessage = (topicName, messageText) => {
    if (!session) throw new Error('Session not initialized');
    const message = solace.SolclientFactory.createMessage();
    message.setDestination(solace.SolclientFactory.createTopicDestination(topicName));
    message.setBinaryAttachment(messageText);
    session.send(message);
};

export const subscribeToTopic = (topicName, callback) => {
    if (!session) throw new Error('Session not initialized');
    try {
        session.subscribe(
            solace.SolclientFactory.createTopicDestination(topicName),
            true,
            topicName,
            10000
        );
        session.on(solace.SessionEventCode.MESSAGE, (message) => {
            // Decode payload as UTF-8 text
            let payload = message.getBinaryAttachment();
            if (payload instanceof ArrayBuffer || payload instanceof Uint8Array) {
                payload = new TextDecoder('utf-8').decode(payload);
            }
            // Attempt to parse as JSON
            try {
                const jsonPayload = JSON.parse(payload);
                callback(jsonPayload); // Pass parsed JSON to callback
            } catch (err) {
                console.error('Failed to parse message as JSON:', err);
                callback(payload); // Fallback to raw payload
            }
        });
    } catch (err) {
        throw new Error('Subscription failed: ' + err.message);
    }
};