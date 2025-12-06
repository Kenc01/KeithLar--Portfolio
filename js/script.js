// toggle icon bar
let menuIcon = document.querySelector("#menu-icon");
let navbar = document.querySelector(".navbar");

if (menuIcon) {
  menuIcon.onclick = () => {
    menuIcon.classList.toggle("bx-x");
    navbar.classList.toggle("active");
  };
}

// scroll sections - only for pages with multiple sections
let sections = document.querySelectorAll("section");
let navLinks = document.querySelectorAll("header nav a");
let header = document.querySelector("header");

window.onscroll = () => {
  // Only run scroll-based nav highlighting on home page (multiple sections)
  if (sections.length > 1) {
    sections.forEach((sec) => {
      let top = window.scrollY;
      let offset = sec.offsetTop - 100;
      let height = sec.offsetHeight;
      let id = sec.getAttribute("id");

      if (top >= offset && top < offset + height) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
        });
        const activeLink = document.querySelector("header nav a[href*=" + id + "]");
        if (activeLink) {
          activeLink.classList.add("active");
        }
      }
    });
  }

  // Toggle sticky header on scroll
  if (header) {
    header.classList.toggle("sticky", window.scrollY > 100);
  }

  // Close mobile menu on scroll
  if (menuIcon) {
    menuIcon.classList.remove("bx-x");
  }
  if (navbar) {
    navbar.classList.remove("active");
  }
};

// For inner pages, add sticky class immediately since they start scrolled
document.addEventListener("DOMContentLoaded", function () {
  // If we're on an inner page (single section), keep header sticky
  if (sections.length === 1 && header) {
    header.classList.add("sticky");
  }
});

// Contact Form Submission
document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.querySelector(".contact form");

  if (contactForm) {
    contactForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const inputs = contactForm.querySelectorAll("input, textarea");
      const formData = {
        fullName: inputs[0].value.trim(),
        email: inputs[1].value.trim(),
        mobile: inputs[2].value.trim(),
        subject: inputs[3].value.trim(),
        message: inputs[4].value.trim(),
      };

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success) {
          showNotification("Message sent successfully!", "success");
          contactForm.reset();
        } else {
          showNotification(
            result.error || "Failed to send message. Please try again.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error:", error);
        showNotification(
          "Network error. Please check your connection and try again.",
          "error"
        );
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});

function showNotification(message, type) {
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}
