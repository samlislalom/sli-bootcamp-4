document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");
  const capabilitySelect = document.getElementById("capability");
  const registerForm = document.getElementById("register-form");
  const messageDiv = document.getElementById("message");
  const authIcon = document.getElementById("auth-icon");
  const loginModal = document.getElementById("login-modal");
  const closeLogin = document.getElementById("close-login");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");

  let isPracticeLead = false;

  // Show/hide login modal
  authIcon.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
    loginModal.style.display = "block";
  });
  closeLogin.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginModal.style.display = "none";
    loginMessage.classList.add("hidden");
    loginForm.reset();
  });

  // Login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(username + ":" + password)
        }
      });
      const result = await response.json();
      if (response.ok) {
        isPracticeLead = true;
        loginMessage.textContent = "Login successful!";
        loginMessage.className = "success";
        loginMessage.classList.remove("hidden");
        registerForm.classList.remove("hidden");
        loginModal.classList.add("hidden");
        loginModal.style.display = "none";
      } else {
        loginMessage.textContent = result.detail || "Login failed.";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (error) {
      loginMessage.textContent = "Error logging in.";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
    }
  });

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      const capabilities = await response.json();
      capabilitiesList.innerHTML = "";
      capabilitySelect.innerHTML = '<option value="">-- Select a capability --</option>';
      Object.entries(capabilities).forEach(([name, details]) => {
        const capabilityCard = document.createElement("div");
        capabilityCard.className = "capability-card";
        const availableCapacity = details.capacity || 0;
        const currentConsultants = details.consultants ? details.consultants.length : 0;
        // Create consultants HTML with delete icons (only for practice leads)
        const consultantsHTML =
          details.consultants && details.consultants.length > 0
            ? `<div class="consultants-section">
              <h5>Registered Consultants:</h5>
              <ul class="consultants-list">
                ${details.consultants
                  .map(
                    (email) =>
                      `<li><span class="consultant-email">${email}</span>${isPracticeLead ? `<button class="delete-btn" data-capability="${name}" data-email="${email}">❌</button>` : ''}</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No consultants registered yet</em></p>`;
        capabilityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Practice Area:</strong> ${details.practice_area}</p>
          <p><strong>Industry Verticals:</strong> ${details.industry_verticals ? details.industry_verticals.join(', ') : 'Not specified'}</p>
          <p><strong>Capacity:</strong> ${availableCapacity} hours/week available</p>
          <p><strong>Current Team:</strong> ${currentConsultants} consultants</p>
          <div class="consultants-container">
            ${consultantsHTML}
          </div>
        `;
        capabilitiesList.appendChild(capabilityCard);
        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        capabilitySelect.appendChild(option);
      });
      // Add event listeners to delete buttons (only for practice leads)
      if (isPracticeLead) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
    } catch (error) {
      capabilitiesList.innerHTML =
        "<p>Failed to load capabilities. Please try again later.</p>";
      console.error("Error fetching capabilities:", error);
    }
  }

  // Handle unregister functionality (practice lead only)
  async function handleUnregister(event) {
    const button = event.target;
    const capability = button.getAttribute("data-capability");
    const email = button.getAttribute("data-email");
    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(capability)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchCapabilities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission (practice lead only)
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const capability = document.getElementById("capability").value;
    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(capability)}/register?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        registerForm.reset();
        fetchCapabilities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to register. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error registering:", error);
    }
  });

  // Initialize app
  fetchCapabilities();
});
