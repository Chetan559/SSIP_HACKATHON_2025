// script.js
// Set ngrok URL here
const ngrokUrl = "https://ab70-35-234-168-124.ngrok-free.app/generate"; // Replace with your ngrok URL

document.querySelector(".send-btn").addEventListener("click", function () {
  const inputField = document.querySelector(".chat-input");
  const userMessage = inputField.value.trim();

  if (userMessage) {
    // Add user message
    const chatMessages = document.querySelector(".chat-messages");
    const userMessageDiv = document.createElement("div");
    userMessageDiv.className = "message user-message";
    userMessageDiv.textContent = userMessage;
    chatMessages.appendChild(userMessageDiv);

    // Clear input field
    inputField.value = "";

    // Make API call to ngrok Flask backend
    fetch(ngrokUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input_text: userMessage }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Add bot response
        const botMessageDiv = document.createElement("div");
        botMessageDiv.className = "message bot-message";
        botMessageDiv.textContent = data.generated_text;
        chatMessages.appendChild(botMessageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

// Allow Enter key to send message
document
  .querySelector(".chat-input")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      document.querySelector(".send-btn").click();
    }
  });

// Make history items clickable
document.querySelectorAll(".history-item").forEach((item) => {
  item.addEventListener("click", function () {
    document
      .querySelectorAll(".history-item")
      .forEach((i) => i.classList.remove("active"));
    this.classList.add("active");
  });
});
