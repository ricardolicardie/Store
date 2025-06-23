// Dashboard Page JavaScript
class DashboardManager {
  constructor() {
    this.orders = JSON.parse(localStorage.getItem("orders") || "[]")
    this.user = JSON.parse(
      localStorage.getItem("user") || '{"firstName": "Usuario", "lastName": "Demo", "email": "usuario@demo.com"}',
    )
    this.currentTab = "orders"

    this.init()
  }

  init() {
    this.renderUserInfo()
    this.renderStats()
    this.renderOrders()
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".dashboard-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Profile form
    document.getElementById("profileForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.updateProfile()
    })

    // Password form
    document.getElementById("passwordForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.changePassword()
    })

    // Category filter
    document.getElementById("categoryFilter").addEventListener("change", (e) => {
      this.filterInvitations(e.target.value)
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })
  }

  renderUserInfo() {
    document.getElementById("userName").textContent = this.user.firstName
    document.getElementById("profileFirstName").value = this.user.firstName
    document.getElementById("profileLastName").value = this.user.lastName
    document.getElementById("profileEmail").value = this.user.email
    document.getElementById("profilePhone").value = this.user.phone || ""
  }

  renderStats() {
    const totalOrders = this.orders.length
    const totalInvitations = this.orders.reduce((sum, order) => sum + order.items.length, 0)
    const totalDownloads = totalInvitations * 2 // Assuming each invitation is downloaded twice on average

    document.getElementById("totalOrders").textContent = totalOrders
    document.getElementById("totalInvitations").textContent = totalInvitations
    document.getElementById("totalDownloads").textContent = totalDownloads
  }

  renderOrders() {
    const ordersList = document.getElementById("ordersList")
    const emptyOrders = document.getElementById("emptyOrders")

    if (this.orders.length === 0) {
      emptyOrders.style.display = "block"
      return
    }

    emptyOrders.style.display = "none"

    // Clear existing orders
    const existingOrders = ordersList.querySelectorAll(".order-card")
    existingOrders.forEach((order) => order.remove())

    this.orders.forEach((order) => {
      const orderCard = document.createElement("div")
      orderCard.className = "order-card"
      orderCard.innerHTML = `
                <div class="order-header">
                    <div class="order-info">
                        <h3>Pedido ${order.orderNumber}</h3>
                        <p class="order-date">${this.formatDate(order.date)}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge status-${order.status}">${this.getStatusText(order.status)}</span>
                    </div>
                </div>
                <div class="order-items">
                    ${order.items
                      .map(
                        (item) => `
                        <div class="order-item">
                            <div class="order-item-info">
                                <h4>${item.name}</h4>
                                <p>${this.getCategoryName(item.category)}</p>
                            </div>
                            <div class="order-item-actions">
                                <button class="btn btn-outline btn-sm" onclick="dashboardManager.downloadInvitation('${item.id}', 'png')">
                                    Descargar PNG
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="dashboardManager.downloadInvitation('${item.id}', 'pdf')">
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <div class="order-footer">
                    <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                    <button class="btn btn-outline btn-sm" onclick="dashboardManager.viewOrderDetails('${order.orderNumber}')">
                        Ver Detalles
                    </button>
                </div>
            `
      ordersList.appendChild(orderCard)
    })
  }

  renderInvitations() {
    const invitationsGrid = document.getElementById("invitationsGrid")
    const emptyInvitations = document.getElementById("emptyInvitations")

    // Get all invitations from orders
    const allInvitations = this.orders.flatMap((order) =>
      order.items.map((item) => ({
        ...item,
        orderNumber: order.orderNumber,
        orderDate: order.date,
      })),
    )

    if (allInvitations.length === 0) {
      emptyInvitations.style.display = "block"
      invitationsGrid.innerHTML = ""
      return
    }

    emptyInvitations.style.display = "none"

    invitationsGrid.innerHTML = ""
    allInvitations.forEach((invitation) => {
      const invitationCard = document.createElement("div")
      invitationCard.className = "invitation-card"
      invitationCard.innerHTML = `
                <div class="invitation-preview" style="background: ${invitation.data.primaryColor};">
                    <div class="invitation-preview-content">
                        <h4>${invitation.data.title}</h4>
                        <p>${invitation.data.eventName}</p>
                        <small>${invitation.data.date}</small>
                    </div>
                </div>
                <div class="invitation-info">
                    <h3>${invitation.name}</h3>
                    <p class="invitation-category">${this.getCategoryName(invitation.category)}</p>
                    <p class="invitation-order">Pedido: ${invitation.orderNumber}</p>
                    <div class="invitation-actions">
                        <button class="btn btn-outline btn-sm" onclick="dashboardManager.editInvitation('${invitation.id}')">
                            Editar
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="dashboardManager.downloadInvitation('${invitation.id}', 'pdf')">
                            Descargar
                        </button>
                    </div>
                </div>
            `
      invitationsGrid.appendChild(invitationCard)
    })
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".dashboard-tab").forEach((tab) => {
      tab.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    // Update tab content
    document.querySelectorAll(".dashboard-tab-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById(`${tabName}-tab`).classList.add("active")

    this.currentTab = tabName

    // Load tab-specific content
    if (tabName === "invitations") {
      this.renderInvitations()
    }
  }

  updateProfile() {
    const firstName = document.getElementById("profileFirstName").value
    const lastName = document.getElementById("profileLastName").value
    const email = document.getElementById("profileEmail").value
    const phone = document.getElementById("profilePhone").value

    this.user = {
      ...this.user,
      firstName,
      lastName,
      email,
      phone,
    }

    localStorage.setItem("user", JSON.stringify(this.user))
    this.renderUserInfo()

    showNotification("Perfil actualizado exitosamente")
  }

  changePassword() {
    const currentPassword = document.getElementById("currentPassword").value
    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification("Por favor completa todos los campos", "error")
      return
    }

    if (newPassword !== confirmPassword) {
      showNotification("Las contraseñas no coinciden", "error")
      return
    }

    if (newPassword.length < 6) {
      showNotification("La contraseña debe tener al menos 6 caracteres", "error")
      return
    }

    // In a real app, you would validate the current password and update it on the server
    showNotification("Contraseña cambiada exitosamente")
    document.getElementById("passwordForm").reset()
  }

  filterInvitations(category) {
    const invitationCards = document.querySelectorAll(".invitation-card")

    invitationCards.forEach((card) => {
      const cardCategory = card.querySelector(".invitation-category").textContent
      const categoryMatch = category === "all" || cardCategory.toLowerCase().includes(category.toLowerCase())

      card.style.display = categoryMatch ? "block" : "none"
    })
  }

  downloadInvitation(invitationId, format) {
    // In a real app, you would fetch the invitation data and generate the download
    showNotification(`Descargando invitación en formato ${format.toUpperCase()}...`)

    // Simulate download
    setTimeout(() => {
      showNotification("¡Descarga completada!")
    }, 1500)
  }

  editInvitation(invitationId) {
    // Find the invitation and redirect to editor
    const allInvitations = this.orders.flatMap((order) => order.items)
    const invitation = allInvitations.find((item) => item.id == invitationId)

    if (invitation) {
      localStorage.setItem("editingInvitation", JSON.stringify(invitation))
      window.location.href = `product-detail.html?edit=true&category=${invitation.category}`
    }
  }

  viewOrderDetails(orderNumber) {
    const order = this.orders.find((o) => o.orderNumber === orderNumber)
    if (order) {
      // In a real app, you might open a modal or navigate to a detailed view
      alert(
        `Detalles del pedido ${orderNumber}:\n\nFecha: ${this.formatDate(order.date)}\nTotal: $${order.total.toFixed(2)}\nEstado: ${this.getStatusText(order.status)}`,
      )
    }
  }

  logout() {
    if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      // Clear user session (in a real app, you might also clear auth tokens)
      localStorage.removeItem("user")
      window.location.href = "index.html"
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  getStatusText(status) {
    const statusTexts = {
      pending: "Pendiente",
      processing: "Procesando",
      completed: "Completado",
      cancelled: "Cancelado",
    }
    return statusTexts[status] || status
  }

  getCategoryName(category) {
    const categories = {
      cumpleanos: "Cumpleaños",
      bodas: "Bodas",
      "baby-shower": "Baby Shower",
      graduaciones: "Graduaciones",
      empresariales: "Empresariales",
      quinceaneras: "Quinceañeras",
    }
    return categories[category] || "Invitación"
  }
}

// Initialize dashboard manager
let dashboardManager
document.addEventListener("DOMContentLoaded", () => {
  dashboardManager = new DashboardManager()
})

// Utility function for notifications
function showNotification(message, type = "success") {
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

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

  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 300)
  }, 3000)
}
