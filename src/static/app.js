document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep the placeholder option)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        let spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (with delete buttons)
        const participantsHtml = (details.participants && details.participants.length)
          ? `<div class="participants-section">
               <strong>Participants:</strong>
               <ul class="participants-list">
                 ${details.participants.map((p) => `
                   <li>
                     <span class="participant-email">${p}</span>
                     <button type="button" class="remove-btn" data-email="${p}" title="Remove participant">✖</button>
                   </li>
                 `).join("")}
               </ul>
             </div>`
          : `<div class="participants-section">
               <strong>Participants:</strong>
               <p class="no-participants">No participants yet</p>
             </div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach remove handlers for participant delete buttons
        activityCard.querySelectorAll('.remove-btn').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const button = e.target;
            const email = button.dataset.email;
            console.log('Removing participant:', email, 'from activity:', name);
            try {
              const url = `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`;
              console.log('Fetch URL:', url);
              const res = await fetch(url, { method: 'DELETE' });

              console.log('Response status:', res.status);
              const data = await res.json();
              console.log('Response data:', data);

              if (res.ok) {
                // Remove the participant element from the DOM
                const li = button.closest('li');
                if (li) li.remove();

                // Update spots left
                spotsLeft += 1;
                const spotsEl = activityCard.querySelector('.spots-left');
                if (spotsEl) spotsEl.textContent = spotsLeft;

                // If no participants left, show fallback message
                const list = activityCard.querySelector('.participants-list');
                if (!list || list.children.length === 0) {
                  const section = activityCard.querySelector('.participants-section');
                  if (section) section.innerHTML = `<strong>Participants:</strong> <p class="no-participants">No participants yet</p>`;
                }

                messageDiv.textContent = data.message || 'Participant removed';
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');

                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              } else {
                messageDiv.textContent = data.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show updated participants and availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
