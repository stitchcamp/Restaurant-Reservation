document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const viewTablesBtn = document.getElementById('view-tables-btn');
  const viewReservationsBtn = document.getElementById('view-reservations-btn');
  const tablesSection = document.getElementById('tables-section');
  const reservationsSection = document.getElementById('reservations-section');
  const tablesList = document.getElementById('tables-list');
  const reservationsList = document.getElementById('reservations-list');
  const tableSelect = document.getElementById('table-select');
  const reservationForm = document.getElementById('reservation-form');
  const editModal = document.getElementById('edit-modal');
  const closeModal = document.querySelector('.close-modal');
  const editForm = document.getElementById('edit-form');
  const editTableSelect = document.getElementById('edit-table');
  const notification = document.getElementById('notification');

  const API_BASE_URL = '/api';

  // Initialize current date
  const dateInput = document.getElementById('date');    
  const today = new Date();   
  const formattedDate = today.toISOString().split('T')[0];
  dateInput.value = formattedDate;
  dateInput.min = formattedDate;

  // Navigation
  viewTablesBtn.addEventListener('click', () => {
    viewTablesBtn.classList.add('active');
    viewReservationsBtn.classList.remove('active');
    tablesSection.classList.add('active-section');
    reservationsSection.classList.remove('active-section');
    loadTables();
  });

  viewReservationsBtn.addEventListener('click', () => {
    viewReservationsBtn.classList.add('active');
    viewTablesBtn.classList.remove('active');
    reservationsSection.classList.add('active-section');
    tablesSection.classList.remove('active-section');
    loadReservations();
  });

  // Close modal
  closeModal.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.style.display = 'none';
    }
  });

  // Load Tables
  async function loadTables() {
    try {
      tablesList.innerHTML = '<div class="loading">Loading available tables...</div>';

      const response = await fetch(`${API_BASE_URL}/tables`);
      if (!response.ok) throw new Error('Failed to fetch tables');

      const tables = await response.json();
      tablesList.innerHTML = '';
      tableSelect.innerHTML = '<option value="">Select a table</option>';

      if (tables.length === 0) {
        tablesList.innerHTML = '<p>No tables available at the moment.</p>';
        return;
      }

      tables.forEach(table => {
        const tableCard = document.createElement('div');
        tableCard.className = `table-card ${table.isAvailable ? '' : 'unavailable'}`;

        tableCard.innerHTML = `
          <span class="table-status ${table.isAvailable ? 'status-available' : 'status-unavailable'}">
            ${table.isAvailable ? 'Available' : 'Reserved'}
          </span>
          <div class="table-number">Table ${table.number}</div>
          <div class="table-capacity">
            <i class="fas fa-user"></i> ${table.capacity} ${table.capacity === 1 ? 'person' : 'people'}
          </div>
        `;

        tablesList.appendChild(tableCard);

        if (table.isAvailable) {
          const option = document.createElement('option');
          option.value = table.id;
          option.textContent = `Table ${table.number} (${table.capacity} ${table.capacity === 1 ? 'person' : 'people'})`;
          tableSelect.appendChild(option);
        }
      });
    } catch (error) {
      console.error('Error loading tables:', error);
      tablesList.innerHTML = '<p>Error loading tables. Please try again later.</p>';
      showNotification('Error loading tables', 'error');
    }
  }

  // Load Reservations
  async function loadReservations() {
    try {
      reservationsList.innerHTML = '<div class="loading">Loading reservations...</div>';

      const response = await fetch(`${API_BASE_URL}/reservations`);
      if (!response.ok) throw new Error('Failed to fetch reservations');

      const reservations = await response.json();
      reservationsList.innerHTML = '';

      if (reservations.length === 0) {
        reservationsList.innerHTML = '<p>No reservations found.</p>';
        return;
      }

      reservations.forEach(reservation => {
        const reservationCard = document.createElement('div');
        reservationCard.className = 'reservation-card';

        const reservationDate = new Date(`${reservation.date}T${reservation.time}`);
        const formattedDate = reservationDate.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        const formattedTime = reservationDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

        reservationCard.innerHTML = `
          <div class="reservation-info">
            <h4>${reservation.name}</h4>
            <div class="reservation-date">${formattedDate} at ${formattedTime}</div>
          </div>
          <div class="reservation-details">
            <div class="detail-item"><i class="fas fa-table"></i> Table ${reservation.tableNumber || reservation.tableId}</div>
            <div class="detail-item"><i class="fas fa-users"></i> ${reservation.guests} guests</div>
            <div class="detail-item"><i class="fas fa-phone"></i> ${reservation.phone}</div>
          </div>
          <div class="reservation-actions">
            <button class="btn-edit" data-id="${reservation.id}">Edit</button>
            <button class="btn-cancel" data-id="${reservation.id}">Cancel</button>
          </div>
        `;

        // Edit button listener
        reservationCard.querySelector('.btn-edit').addEventListener('click', () => {
          openEditModal(reservation);
        });

        // Cancel button listener
        reservationCard.querySelector('.btn-cancel').addEventListener('click', async () => {
          await cancelReservation(reservation.id);
        });

        reservationsList.appendChild(reservationCard);
      });
    } catch (error) {
      console.error('Error loading reservations:', error);
      reservationsList.innerHTML = '<p>Error loading reservations. Please try again later.</p>';
      showNotification('Error loading reservations', 'error');
    }
  }

  // Open Edit Modal
  function openEditModal(reservation) {
    document.getElementById('edit-id').value = reservation.id;
    document.getElementById('edit-name').value = reservation.name;
    document.getElementById('edit-phone').value = reservation.phone;
    document.getElementById('edit-guests').value = reservation.guests;
    document.getElementById('edit-table').value = reservation.tableId;
    document.getElementById('edit-date').value = reservation.date;
    document.getElementById('edit-time').value = reservation.time;

    editModal.style.display = 'block';
  }

  // Cancel Reservation
  async function cancelReservation(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/cancel/${id}`, { method: 'DELETE' });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to cancel reservation');
      }

      showNotification(responseData.success || 'Reservation canceled');
      loadReservations();
    } catch (error) {
      console.error('Cancel reservation error:', error);
      showNotification(error.message || 'Failed to cancel reservation', 'error');
    }
  }

  // Handle Reservation Form Submission
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(reservationForm);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const date = formData.get('date');
    const time = formData.get('time');
    const tableId = formData.get('tableId');
    const guests = formData.get('guests');
    
    // Validate required fields
    const missingFields = [];
    if (!name || name.trim() === '') missingFields.push('Name');
    if (!guests || guests.trim() === '') missingFields.push('Number of guests');
    if (!tableId || tableId === '') missingFields.push('Table selection');
    if (!time || time === '') missingFields.push('Time');
    
    if (missingFields.length > 0) {
      showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
      return;
    }
    
    // Validate guest count is a positive number
    if (isNaN(guests) || parseInt(guests) <= 0) {
      showNotification('Guest count must be a positive number', 'error');
      return;
    }
    
    const reservationData = {
      name,
      phone,
      date,
      time,
      tableId,
      guests: parseInt(guests),
    };

    try {
      showNotification('Processing your reservation...', 'info');
      
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to make reservation');
      }

      showNotification(responseData.success || 'Reservation successful');
      reservationForm.reset();
      dateInput.value = formattedDate;

      // Refresh data
      loadTables();
      loadReservations();

      // Optionally switch to reservations tab
      viewReservationsBtn.click();
    } catch (error) {
      console.error('Reservation error:', error);
      showNotification(error.message || 'Failed to reserve table', 'error');
    }
  });

  // Notification
  function showNotification(message, type = 'success') {
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  // Initial Load
  viewTablesBtn.click();
});
