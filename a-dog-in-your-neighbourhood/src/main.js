import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', async () => {
    const postcode = window.prompt('Enter a UK postcode to generate your road maze', 'SW1A 1AA');

    if (!postcode) {
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/generate-map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ postcode })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Unable to generate map from postcode.');
        }

        StartGame('game-container');
    } catch (error) {
        console.error(error);
        window.alert(error.message || 'There was a problem generating the map.');
    }
});