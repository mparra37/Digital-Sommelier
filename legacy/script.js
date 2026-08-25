

/*function enviar(){
    const userInput = document.getElementById('userInput').value;
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response').innerText = data.message;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

document.getElementById('talk-button').addEventListener('click', () => {
    const userInput = document.getElementById('userInput').value;
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response').innerText = data.message;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

document.getElementById('btn_iniciar').addEventListener('click', ()=> {
    fetch('/iniciar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response').innerText = data.message;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});*/

// Function to toggle button classes
function toggleButtonClasses() {
    var button = document.getElementById('voice-typing-button');
    button.classList.toggle('btn-success');
    button.classList.toggle('btn-outline-danger');
}

// Add click event listener to button
document.getElementById('voice-typing-button').addEventListener('click', toggleButtonClasses);

// Add keydown event listener to document
document.addEventListener('keydown', function(event) {
    // Check if the spacebar key was pressed
    if (event.key === " " || event.keyCode === 32) {
        // Prevent the default spacebar action (scrolling the page down)
        event.preventDefault();
        // Toggle the button classes
        toggleButtonClasses();
    }
});