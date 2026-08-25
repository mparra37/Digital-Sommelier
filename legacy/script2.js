/*
* Pasos
* 1.- Introducción
* 2.- Colores 
*    2.1.- respuesta no esperada
     2.2.- respuesta esperada pero corta
     2.3.- respuesta del color del vino
  3.- Aromas
     3.1.- primeros aromas
     3.2.- liberar aromas
     3.3.- respuesta de los aromas
  4.- Sabor
     4.1.- primeros sabores
     4.2.- segundo sorbo
     4.3.- respuesta del sabor
  5.- Maridaje
     5.1.- No le gustó
     5.2.- Si le gustó
  6.- Cierre

  Extra: 
  7.- No tengo respuesta
*/

var estado = 0;

var talkVideo = document.getElementById("talk-video");
var btn_iniciar = document.getElementById("btn_inicar");

btn_iniciar.addEventListener('click', function() {

  playIdleVideo();
  //estado = 1;
    //playVideo("videos/intro.mp4");
});


function playVideo(video_src) {
  
  //if(video_src === null){
    //video_src = 'videos/intro.mp4'
  //}
  talkVideo.srcObject = null; // Use null when resetting srcObject
  talkVideo.src = video_src; // Adjusted path
  //talkVideo.loop = true;
  talkVideo.load(); // Load the new video source
  talkVideo.loop = false;
  
  talkVideo.onended = null;
  // Add an event listener for when the video ends
  talkVideo.onended = function() {
      playIdleVideo(); // This function should play the idle video
  };

  talkVideo.play();
}

function toggleButtonClasses() {
    var button = document.getElementById('voice-typing-button');
    button.classList.toggle('btn-success');
    button.classList.toggle('btn-outline-danger');
}

// Add click event listener to button
var isRecording = false;
var recognition = new webkitSpeechRecognition();
document.addEventListener('DOMContentLoaded', () => {
    if ('webkitSpeechRecognition' in window) {
        
        recognition.continuous = true; // Set this to true if you want the recognition to continue even after it detects a pause in speaking
        recognition.interimResults = true; // Show interim results
        recognition.lang = 'es-MX'; // Set the language of the recognition

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
          //enviar();
          isRecording = false;
          document.getElementById('voice-typing-button').classList.remove('btn-success');
          document.getElementById('voice-typing-button').classList.add('btn-outline-danger'); 
          document.getElementById('user-input-field').value = ""// Change to your default button color
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
    }, 100); // Adjust the speed as needed
}



function reproducir_pasos(){
  const responseContainer = document.getElementById('response-field');

  if(estado==1){
    playVideo("videos/intro.mp4");
    animateText(pasosPrincipales[0], responseContainer);

  }
  if(estado == 2){
        playVideo("videos/color.mp4");
        animateText(pasosPrincipales[1], responseContainer);
    }
    if(estado == 3){
      playVideo("videos/aroma.mp4");
      animateText(pasosPrincipales[2], responseContainer);
    }
    if(estado== 4){
      playVideo("videos/gusto.mp4");
      animateText(pasosPrincipales[3], responseContainer);
    }
    if(estado==5){
      //playVideo("videos/maridaje.mp4");
      playVideo("videos/maridaje_tinto.mp4");
      animateText(pasosPrincipales[4], responseContainer);
    }
    if(estado==6){
      playVideo("videos/cierre.mp4");
      animateText(pasosPrincipales[5], responseContainer);
    }
}



document.addEventListener('keydown', function(event) {
    const responseContainer = document.getElementById('response-field');
    // Check if number 0 key was pressed
    if (event.key === " ArrowDown" || event.keyCode===40) {
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
              //respuesta_usuario();
            }
    }

    if (event.key === "ArrowRight" || event.keyCode === 39) {
        estado++;
        reproducir_pasos();
        
        // Your specific action goes here
        //console.log('Right arrow key pressed');
        // For example, if you're handling a carousel, you might call its 'next' function here
    }

    if (event.key === "ArrowLeft" || event.keyCode === 37) {
        estado--;
        reproducir_pasos();
        
        // Your specific action goes here
        //console.log('Right arrow key pressed');
        // For example, if you're handling a carousel, you might call its 'next' function here
    }

    if (event.key === "ArrowUp" || event.keyCode === 38) {
        var responseField = document.getElementById("response-field");

        if (responseField.style.color === "rgb(18, 18, 18)") {
            responseField.style.color = "white";
          } else {
            responseField.style.color = "#121212";
          }
        
        
    }


    if(event.key === "1"){
        if(estado==2){
          playVideo("videos/color_primero.mp4");
          animateText(subpasos_color[0], responseContainer);

        }    
        if(estado==3){
          playVideo("videos/aroma_primero.mp4");
          animateText(subpasos_aroma[0], responseContainer);
        }
        if(estado==4){
          playVideo("videos/gusto_primero.mp4");
          animateText(subpasos_gusto[0], responseContainer);
        }
      
      if(estado==5){
          playVideo("videos/maridaje_primero.mp4");
          animateText(subpasos_maridaje[0], responseContainer);
        }
    }

    if(event.key === "2"){
        if(estado==2){
          playVideo("videos/color_segundo.mp4");
          animateText(subpasos_color[1], responseContainer);
        }  
        if(estado==3){
          playVideo("videos/aroma_segundo.mp4");
          animateText(subpasos_aroma[1], responseContainer);
        }  
        if(estado==4){
          playVideo("videos/gusto_segundo.mp4");
          animateText(subpasos_gusto[1], responseContainer);
        }
        if(estado==5){
          playVideo("videos/maridaje_segundo.mp4");
          animateText(subpasos_maridaje[1], responseContainer);
        }
    }

    if(event.key === "3"){
        if(estado==2){
          //playVideo("videos/color_tercero_rosa.mp4");
          playVideo("videos/color_tercero_tinto.mp4");
          animateText(subpasos_color[2], responseContainer);
        }    
        if(estado==3){
          //playVideo("videos/aroma_tercero_rosa.mp4");
          playVideo("videos/aroma_tercero_tinto.mp4");
          animateText(subpasos_aroma[2], responseContainer);
        }
        if(estado==4){
          //playVideo("videos/gusto_tercero_rosa.mp4");
          playVideo("videos/gusto_tercero_tinto.mp4");
          animateText(subpasos_gusto[2], responseContainer);
        }
    }

    if(event.key === "4"){
        
          playVideo("videos/lo_siento.mp4");
          animateText(extras_txt[0], responseContainer);
            
    }

    if(event.key === "5"){
        
          playVideo("videos/repetir.mp4");
          animateText(extras_txt[1], responseContainer);
          
    }

   

    if(event.key === "6"){
        
          playVideo("videos/extra6.mp4");
          animateText(extras_txt[1], responseContainer);
          
    }

    if(event.key === "7"){
        
          playVideo("videos/extra7.mp4");
          animateText(extras_txt[1], responseContainer);
          
    }

    if(event.key === "8"){
        
          playVideo("videos/extra8.mp4");
          animateText(extras_txt[1], responseContainer);
          
    }

    if(event.key === "9"){
        
          playVideo("videos/extra9.mp4");
          animateText(extras_txt[1], responseContainer);
          
    }

     if(event.key === "0"){
        
          playVideo("videos/extra0.mp4");
          animateText(extras_txt[1], responseContainer);
          
    }

   /*
    if(event.key === "1"){
        var titulo_accion = document.getElementById("titulo_accion");
        titulo_accion.innerHTML = ""
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "Bienvenido a esta cata de vino";

        playVideo("videos/intro.mp4");
    }
    if(event.key === "2"){
      estado = 2;
        //var titulo_accion = document.getElementById("titulo_accion");
        //titulo_accion.innerHTML = "Apariencia"
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "¿De qué color es el vino?";

        playVideo("videos/color.mp4");
    }
    if(event.key === "3"){
      estado = 3;
       //var titulo_accion = document.getElementById("titulo_accion");
        //titulo_accion.innerHTML = "Fragancia"
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "¿Qué aromas distingues en este vino?";

        playVideo("videos/aroma.mp4");
    }
    if(event.key === "4"){
      estado = 4;
       //var titulo_accion = document.getElementById("titulo_accion");
        //titulo_accion.innerHTML = "Gusto"
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "¿Qué sabores distingues en el vino?";

        playVideo("videos/gusto.mp4");
    }
    if(event.key === "5"){
      estado = 5;
      //var titulo_accion = document.getElementById("titulo_accion");
        //titulo_accion.innerHTML = "Cierre"
        var campo_tip = document.getElementById("tip_label");
        campo_tip.innerHTML = "¡Hasta pronto!";

        playVideo("videos/cierre.mp4");
    }
    if(event.key === "6"){
        
    }
    if(event.key === "7"){
        
    }
    if(event.key === "8"){
        
    }
    if(event.key === "9"){
       
    }

    */
});

function playIdleVideo() {
  talkVideo.srcObject = undefined;
  talkVideo.src = 'videos/idle_mago.mp4';
  //talkVideo.src = 'latino_idle.mp4';
  talkVideo.loop = true;
}


//alert("hola");

var pasosPrincipales = [

      "Hola, soy Salomón, tu sommelier para esta experiencia única de cata a ciegas. Es un placer acompañarte en este viaje sensorial. Antes de empezar, quiero que te relajes y te prepares para disfrutar de cada momento ¿Estás listo para descubrir las maravillas del vino?",
      "Comencemos por observar el vino. Toma la copa de vino y sostenla frente a la luz. Observa el color del vino ¿Qué tonalidades puedes identificar? Tómate unos segundos para apreciar su belleza visual.",
      "Ahora, acerca la copa a tu nariz y huele el vino. Permítete sumergirte en los diferentes aromas y disfrutar de la complejidad del vino. ¿Puedes identificar los aromas que emanan de él? Cuando estés listo, intenta describirlos en voz alta.",
      "Ahora, es hora de probar el vino. Toma un sorbo pequeño y déjalo en tu boca por unos segundos. Siente cómo el vino se despliega en tu paladar. Permítete saborear de cada matiz y disfrutar de la experiencia sensorial ¿Puedes identificar los sabores? Cuando estés listo, intenta describirlos en voz alta. ",
      "Este vino es ideal con mariscos, pescados grasos, quesos frescos, paella, pastas con salsa blanca, y platos con un toque picante. En general ¿Qué te ha parecido este vino?",
      "Has completado esta experiencia de degustación de vino. Espero que hayas disfrutado y que esta travesía te haya permitido conectarte plenamente con el vino. Salud y a seguir brindando por la vida. "


  ]

var subpasos_color = [
        "¡Vaya, eso es curioso! A veces, la percepción de color puede variar mucho. ¿Hay otra manera en que podrías describir ese color, quizás algo más acorde con lo que solemos ver en los vinos?",
        "¡Muy bien! Ahora, para ayudarme a entender mejor el tono específico que estás viendo, sería ideal si puedes describir el color con más detalle. ¿Podrías compararlo con algún objeto o elemento que te sea familiar?",
        "Gracias por compartir. Tenemos un Rosé, notable por su color rojo rubí intenso o color granada brillante. Ahora, vamos a explorar los aromas que nos esperan. ¿Listo?"
  ]

var subpasos_aroma = [
        "¡Qué interesante! Los aromas que percibimos pueden ser muy personales.¿Puedes identificar algún otro aroma? Vamos a seguir explorando.",
        "!Muy bien! Ahora, agita suavemente la copa para airear el vino y liberar más aromas. Pruébalo de nuevo y ve si puedes detectar algo diferente. ¿Qué más encuentras?",
        "Este vino en especial posee aromas florales y de frutos rojos, con intensos aromas a frutas frescas como fresa, melocotón, albaricoque y flores dulces como la rosa. ¿Listo para el siguiente paso?"
  ]

var subpasos_gusto = [
        "¡Interesante respuesta! Cada paladar es único y a veces, descubrimos sabores que no anticipábamos. Vamos a considerar esto una parte intrigante del viaje del vino. ¿Hay otros sabores que puedas identificar? ",
        "Puedes probarlo nuevamente. Pero esta vez intenta centrarte aún más en las sensaciones y sabores que se desarrollan en tu boca. ¿Qué más notas en este segundo sorbo?",
        "Este vino tiene sabores de fresas silvestres, melocotones y albaricoques. Esto hace de este vino una excelente opción para maridar con una variedad de platos. ¿Te gustaría conocer las opciones de maridaje para este vino?"
  ]

var subpasos_maridaje = [
        "Entiendo completamente, y es importante recordar que la cata de vinos es una experiencia profundamente personal. Cada paladar es único, y no todos los vinos resonarán de la misma manera con cada persona.",
        "¡Me alegra mucho escuchar eso! Es fantástico saber que has disfrutado de este vino y de la experiencia de catarlo."
  ]

var extras_txt = [
    "Lo siento. No tengo respuesta para esa pregunta en ese momento.",
    "No logré escuchar bien. ¿Podrías repetir lo que dijiste?"

  ]