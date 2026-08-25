// chatGPT.js
const OpenAI = require("openai");
require('dotenv').config(); // Include this line if you are using a .env file


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

//const openai = new OpenAI({
//    apiKey: "api_key"
//});


async function consultar(prompt) {
  const completion = await openai.chat.completions.create({
    messages: [{ 
        role: "system", 
        content: "You are a helpful assistant." 
    },{
        role: "user", 
        content: prompt 
    }
    ],
    model: "gpt-3.5-turbo",
  });

  //console.log(completion.choices[0].message.content);

  return completion.choices[0].message.content;
};

module.exports = {consultar};

/*
async function ejecutar(){
    let respuesta = await consultar("hola quien eres?");

    console.log(typeof(respuesta)); //string
    console.log(respuesta);

};

ejecutar();
*/



