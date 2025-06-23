// Dashboard Page with Firebase Integration
class DashboardManagerFirebase {
  constructor() {
    this.orders = []
    this.user = null
    this.userData = null
    this.currentTab = "orders"

    this.init()
  }

  async init() {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "index.html"
        return
      }

      this.user = user
      await this.loadUserData()
      await this.loadOrders()
      this.renderUserInfo()
      this.renderStats()
      this.renderOrders()
      this.setupEventListeners()
    })
  }

  async loadUserData() {
    try {
      this.userData = await getUserData()
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  async loadOrders() {
    try {
      this.orders = await loadUserOrders()
    } catch (error) {
      console.error("Error loading orders:", error)
      showNotification("Error al cargar pedidos", "error")
    }
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
      this.updateProfileFirebase()
    })

    // Password form
    document.getElementById("passwordForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.changePasswordFirebase()
    })

    // Category filter
    document.getElementById("categoryFilter").addEventListener("change", (e) => {
      this.filterInvitations(e.target.value)
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })

    // Preferences checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.updatePreferencesFirebase()
      })
    })
  }

  renderUserInfo() {
    const displayName = this.user.displayName || "Usuario"
    document.getElementById("userName").textContent = displayName.split(" ")[0]

    if (this.userData) {
      document.getElementById("profileFirstName").value = displayName.split(" ")[0] || ""
      document.getElementById("profileLastName").value = displayName.split(" ").slice(1).join(" ") || ""
      document.getElementById("profileEmail").value = this.user.email || ""
      document.getElementById("profilePhone").value = this.userData.phone || ""

      // Set preferences
      if (this.userData.preferences) {
        document.getElementById("emailNotifications").checked = this.userData.preferences.emailNotifications || false
        document.getElementById("promotionalEmails").checked = this.userData.preferences.promotionalEmails || false
        document.getElementById("newDesignAlerts").checked = this.userData.preferences.newDesignAlerts || false
      }
    } else {
      document.getElementById("profileFirstName").value = displayName.split(" ")[0] || ""
      document.getElementById("profileLastName").value = displayName.split(" ").slice(1).join(" ") || ""
      document.getElementById("profileEmail").value = this.user.email || ""
    }
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
            <p class="order-date">${this.formatDate(order.createdAt)}</p>
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
                  <button class="btn btn-outline btn-sm" onclick="dashboardManagerFirebase.downloadInvitation('${item.id}', 'png')">
                    Descargar PNG
                  </button>
                  <button class="btn btn-outline btn-sm" onclick="dashboardManagerFirebase.downloadInvitation('${item.id}', 'pdf')">
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
          <button class="btn btn-outline btn-sm" onclick="dashboardManagerFirebase.viewOrderDetails('${order.orderNumber}')">
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
        orderDate: order.createdAt,
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
            <button class="btn btn-outline btn-sm" onclick="dashboardManagerFirebase.editInvitation('${invitation.id}')">
              Editar
            </button>
            <button class="btn btn-primary btn-sm" onclick="dashboardManagerFirebase.downloadInvitation('${invitation.id}', 'pdf')">
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

  async updateProfileFirebase() {
    const firstName = document.getElementById("profileFirstName").value
    const lastName = document.getElementById("profileLastName").value
    const email = document.getElementById("profileEmail").value
    const phone = document.getElementById("profilePhone").value

    const profileData = {
      displayName: `${firstName} ${lastName}`.trim(),
      phone: phone,
    }

    try {
      const success = await updateUserProfile(profileData)
      if (success) {
        this.user = firebase.auth().currentUser // Refresh user data
        await this.loadUserData()
        this.renderUserInfo()
        showNotification("Perfil actualizado exitosamente")
      } else {
        showNotification("Error al actualizar perfil", "error")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      showNotification("Error al actualizar perfil", "error")
    }
  }

  async updatePreferencesFirebase() {
    const preferences = {
      emailNotifications: document.getElementById("emailNotifications").checked,
      promotionalEmails: document.getElementById("promotionalEmails").checked,
      newDesignAlerts: document.getElementById("newDesignAlerts").checked,
    }

    try {
      const success = await updateUserPreferences(preferences)
      if (success) {
        showNotification("Preferencias actualizadas")
      }
    } catch (error) {
      console.error("Error updating preferences:", error)
      showNotification("Error al actualizar preferencias", "error")
    }
  }

  async changePasswordFirebase() {
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

    try {
      // Re-authenticate user first
      const credential = firebase.auth.EmailAuthProvider.credential(this.user.email, currentPassword)

      await this.user.reauthenticateWithCredential(credential)

      // Update password
      await this.user.updatePassword(newPassword)

      showNotification("Contraseña cambiada exitosamente")
      document.getElementById("passwordForm").reset()
    } catch (error) {
      console.error("Error changing password:", error)
      if (error.code === "auth/wrong-password") {
        showNotification("Contraseña actual incorrecta", "error")
      } else {
        showNotification("Error al cambiar contraseña", "error")
      }
    }
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
        `Detalles del pedido ${orderNumber}:\n\nFecha: ${this.formatDate(order.createdAt)}\nTotal: $${order.total.toFixed(2)}\nEstado: ${this.getStatusText(order.status)}`,
      )
    }
  }

  async logout() {
    if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      try {
        await signOut()
      } catch (error) {
        console.error("Error signing out:", error)
        showNotification("Error al cerrar sesión", "error")
      }
    }
  }

  formatDate(date) {
    if (!date) return "Fecha no disponible"

    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toLocaleDateString("es-ES", {
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
let dashboardManagerFirebase
document.addEventListener("DOMContentLoaded", () => {
  dashboardManagerFirebase = new DashboardManagerFirebase()
})
