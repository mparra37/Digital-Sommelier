// langindex.js

function getSessionId() {
    let id = sessionStorage.getItem('sessionId');
    if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
        sessionStorage.setItem('sessionId', id);
    }
    return id;
}

var isRecording = false;
var recognition;
document.addEventListener('DOMContentLoaded', () => {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true; // Set this to true if you want the recognition to continue even after it detects a pause in speaking
        recognition.interimResults = true; // Show interim results
        recognition.lang = 'es-MX'; // en-US, es-MX

        //var isRecording = false; // Flag to track recording state
  
        // What to do when speech is detected
        recognition.onresult = function(event) {
          //var transcript= document.getElementById('response-field');
          //transcript.innerHTML = "";
          var final_transcript = "";
          for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final_transcript += event.results[i][0].transcript;
            }
          }
          // Update the text field with the result
         document.getElementById('user-input-field').value += final_transcript;
        };

        // Handle end of speech recognition session
        recognition.onend = function() {
          // Reset the recording state and button color when recognition ends
          enviar();
          isRecording = false;
          document.getElementById('voice-typing-button').classList.remove('btn-success');
          document.getElementById('voice-typing-button').classList.add('btn-outline-danger'); // Change to your default button color
        };
  
        // Toggle the speech recognition when the button is clicked
        document.getElementById('voice-typing-button').addEventListener('click', function() {
            if (!isRecording) {
              recognition.start();
              isRecording = true;
              this.classList.remove('btn-outline-danger'); // Remove the btn-success class
              this.classList.add('btn-success') // Change button color to green
              //var transcript= document.getElementById('response-field');
              //transcript.innerHTML = "";
            } else {
              recognition.stop();
              // Note: The button color will be reset in the onend event handler
              //enviar();
            }
          });
      } else {
          alert("Web Speech API is not supported in this browser.");
      };
});



// Add keydown event listener to document
document.addEventListener('keydown', function(event) {
    // Check if number 0 key was pressed
    if ((event.key === " ArrowDown" || event.keyCode===40) && recognition) {
        // Prevent the default spacebar action (scrolling the page down)
        event.preventDefault();
        var boton_micro = document.getElementById('voice-typing-button');

        if (!isRecording) {
              recognition.start();
              isRecording = true;
              boton_micro.classList.remove('btn-outline-danger'); // Remove the btn-success class
              boton_micro.classList.add('btn-success') // Change button color to green
              //var transcript= document.getElementById('response-field');
              //transcript.innerHTML = "";
            } else {
              recognition.stop();
              // Note: The button color will be reset in the onend event handler
              //enviar();
            }
    }

    if (event.key === "ArrowUp" || event.keyCode === 38) {
        var responseField = document.getElementById("response-field");

        if (responseField.style.color === "rgb(18, 18, 18)") {
            responseField.style.color = "white";
          } else {
            responseField.style.color = "#121212";
          }
        
        
    }

    /*

    if(event.key === "1"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "Ejemplos de los colores en los vinos";
    }
    if(event.key === "2"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "Cómo observar mejor el vino";
    }
    if(event.key === "3"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "El significado de la intensidad del color del vino";
    }
    if(event.key === "4"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "Ejemplos de los aromas en los vinos";
    }
    if(event.key === "5"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "Cómo liberar los aromas del vino en la copa";
    }
    if(event.key === "6"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "La percepción de la acidez del vino";
    }
    if(event.key === "7"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "Qué son los taninos del vino";
    }
    if(event.key === "8"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "El maridaje para acompañar al vino";
    }
    if(event.key === "9"){
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "";
    }

    */
});
    

async function enviar(){
     var sendingSound = new Audio('loading.mp3');
        // Play the sending sound
    sendingSound.play();
    const userInputField = document.getElementById('user-input-field');
    const responseContainer = document.getElementById('response-field'); // Ensure you have a container with this ID in your HTML
    const userInput = userInputField.value;
    userInputField.value = ""; // Clear the input field after capturing the value

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: userInput, sessionId: getSessionId() })
        });
        const responseData = await response.json();

        const chatResponseEvent = new CustomEvent('chatResponse', { detail: responseData.message });
        document.dispatchEvent(chatResponseEvent);

        console.log(responseData);

        // Update the response container with the chatText
        //responseContainer.innerText = responseData.message; // Display the chatText in the response container
        
        //animateText(responseData.message, responseContainer);
        // Dispatch a custom event with the chatText
        
        // Wait for 3 seconds before animating the text
        //setTimeout(function() {
            animateText(responseData.message, responseContainer);
        //, 3000);    
        

    } catch (error) {
        console.error('Error sending query to the server:', error);
        responseContainer.textContent = 'Error: Could not get a response.'; // Display error message
    }
};


document.getElementById('initiate-button').addEventListener('click', ()=> {
    const responseContainer = document.getElementById('response-field');
    fetch('/iniciar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: getSessionId() }),
    })
    .then(response => response.json())
    .then(data => {
        //responseContainer.innerHTML = data.message;
        //animateText(data.message, responseContainer);
        const chatResponseEvent = new CustomEvent('chatResponse', { detail: data.message });
        document.dispatchEvent(chatResponseEvent);

        //setTimeout(function() {
            animateText(data.message, responseContainer);
        //}, 3000);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

function animateText(text, container) {
    const words = text.split(' '); // Split the text into words
    container.innerHTML = ''; // Clear the container
    let i = 0;
    
    const interval = setInterval(() => {
        if (i < words.length) {
            container.innerHTML += words[i] + ' '; // Append word by word
            i++;
        } else {
            clearInterval(interval); // Stop the interval when all words are displayed
        }
    }, 150); // Adjust the speed as needed
}




document.getElementById('talk-button').addEventListener('click', () => {
    enviar();
});

// Enter sends the message; Shift+Enter still inserts a newline.
document.getElementById('user-input-field').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        enviar();
    }
});

document.getElementById('toggle-chat-button').addEventListener('click', function() {
    document.getElementById('der').classList.toggle('chat-hidden');
    this.classList.toggle('active');
});


/*
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

*/
