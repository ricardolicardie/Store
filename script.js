// DOM Elements
const mobileMenuBtn = document.getElementById("mobileMenuBtn")
const mobileMenu = document.getElementById("mobileMenu")
const closeMenuBtn = document.getElementById("closeMenuBtn")
const navbar = document.querySelector(".navbar")
const currentYearSpan = document.getElementById("currentYear")

// Mobile Menu Toggle
function toggleMobileMenu() {
  mobileMenu.classList.toggle("active")
  document.body.style.overflow = mobileMenu.classList.contains("active") ? "hidden" : ""
}

function closeMobileMenu() {
  mobileMenu.classList.remove("active")
  document.body.style.overflow = ""
}

// Event Listeners
mobileMenuBtn.addEventListener("click", toggleMobileMenu)
closeMenuBtn.addEventListener("click", closeMobileMenu)

// Close mobile menu when clicking on links
document.querySelectorAll(".mobile-nav-link").forEach((link) => {
  link.addEventListener("click", closeMobileMenu)
})

// Close mobile menu when clicking outside
mobileMenu.addEventListener("click", (e) => {
  if (e.target === mobileMenu) {
    closeMobileMenu()
  }
})

// Navbar scroll effect
function handleScroll() {
  if (window.scrollY > 10) {
    navbar.classList.add("scrolled")
  } else {
    navbar.classList.remove("scrolled")
  }
}

window.addEventListener("scroll", handleScroll)

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = "running"
    }
  })
}, observerOptions)

// Observe animated elements
document.querySelectorAll(".category-card, .product-card").forEach((el) => {
  observer.observe(el)
})

// Product interactions
document.querySelectorAll(".wishlist-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Toggle heart icon fill
    const icon = btn.querySelector(".icon")
    if (icon.style.fill === "currentColor") {
      icon.style.fill = "none"
      showNotification("Removed from wishlist")
    } else {
      icon.style.fill = "currentColor"
      showNotification("Added to wishlist")
    }
  })
})

document.querySelectorAll(".cart-btn-product").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Update cart count
    const cartCount = document.querySelector(".cart-count")
    const currentCount = Number.parseInt(cartCount.textContent)
    cartCount.textContent = currentCount + 1

    // Add animation to cart button
    btn.style.transform = "scale(1.2)"
    setTimeout(() => {
      btn.style.transform = "scale(1)"
    }, 200)

    showNotification("Added to cart")
  })
})

// Newsletter form
const newsletterForm = document.querySelector(".newsletter-form")
const newsletterInput = document.querySelector(".newsletter-input")

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const email = newsletterInput.value.trim()

    if (email && isValidEmail(email)) {
      showNotification("Successfully subscribed to newsletter!")
      newsletterInput.value = ""
    } else {
      showNotification("Please enter a valid email address", "error")
    }
  })
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Notification system
function showNotification(message, type = "success") {
  // Remove existing notifications
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  // Add styles
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: type === "success" ? "linear-gradient(to right, #ec4899, #a855f7)" : "#ef4444",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: "1000",
    fontSize: "14px",
    fontWeight: "500",
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
    maxWidth: "300px",
    wordWrap: "break-word",
  })

  document.body.appendChild(notification)

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 300)
  }, 3000)
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Category hover effects
document.querySelectorAll(".category-card").forEach((card) => {
  const line = card.querySelector(".category-line")

  card.addEventListener("mouseenter", () => {
    line.style.width = "100%"
  })

  card.addEventListener("mouseleave", () => {
    line.style.width = "40px"
  })
})

// Product card hover effects
document.querySelectorAll(".product-card").forEach((card) => {
  const actions = card.querySelector(".product-actions")

  card.addEventListener("mouseenter", () => {
    actions.style.opacity = "1"
  })

  card.addEventListener("mouseleave", () => {
    actions.style.opacity = "0"
  })
})

// Initialize current year in footer
if (currentYearSpan) {
  currentYearSpan.textContent = new Date().getFullYear()
}

// Lazy loading for images
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target
      if (img.dataset.src) {
        img.src = img.dataset.src
        img.removeAttribute("data-src")
        imageObserver.unobserve(img)
      }
    }
  })
})

// Observe all images for lazy loading
document.querySelectorAll("img[data-src]").forEach((img) => {
  imageObserver.observe(img)
})

// Keyboard navigation support
document.addEventListener("keydown", (e) => {
  // Close mobile menu with Escape key
  if (e.key === "Escape" && mobileMenu.classList.contains("active")) {
    closeMobileMenu()
  }

  // Focus management for accessibility
  if (e.key === "Tab") {
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    )

    if (mobileMenu.classList.contains("active")) {
      const mobileMenuFocusable = mobileMenu.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      )

      const firstFocusable = mobileMenuFocusable[0]
      const lastFocusable = mobileMenuFocusable[mobileMenuFocusable.length - 1]

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable.focus()
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable.focus()
      }
    }
  }
})

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Apply debounce to scroll handler
window.removeEventListener("scroll", handleScroll)
window.addEventListener("scroll", debounce(handleScroll, 10))

// Initialize animations on page load
document.addEventListener("DOMContentLoaded", () => {
  // Add loaded class to body for CSS animations
  document.body.classList.add("loaded")

  // Initialize any elements that need immediate animation
  const heroElements = document.querySelectorAll(".hero-text > *")
  heroElements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.1}s`
  })
})

console.log("StyleHaven website loaded successfully! 🎉")

// Smooth scroll to section function
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId)
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}

// Update cart count on page load
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount()
})

// Function to update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const cartCount = document.getElementById("cartCount")
  if (cartCount) {
    cartCount.textContent = cart.length
  }
}
