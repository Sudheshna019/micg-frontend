import { auth, BACKEND_URL } from "./firebase-config.js";
 
document.addEventListener('DOMContentLoaded', () => {
    const savedCaptionsList = document.getElementById('saved-captions-list');
    const emptyMessage = document.getElementById('empty-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const refreshBtn = document.getElementById('refresh-btn');
 
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => fetchSavedCaptions());
    }
 
    function showToast(message, type = "success") {
        const toastEl = document.getElementById('toast-message');
        if (!toastEl) return;
        toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0 show`;
        const bodyEl = toastEl.querySelector('.toast-body');
        if (bodyEl) bodyEl.textContent = message;
        setTimeout(() => toastEl.classList.remove('show'), 3000);
    }
 
    async function fetchSavedCaptions(retryCount = 0) {
        const user = auth.currentUser;
        if (!user) {
            console.warn("No user logged in.");
            return;
        }
 
        if (loadingSpinner) loadingSpinner.classList.remove('d-none');
        if (emptyMessage) emptyMessage.classList.add('d-none');
        if (savedCaptionsList) savedCaptionsList.innerHTML = '';
 
        try {
            const idToken = await user.getIdToken(true);
            const response = await fetch(`${BACKEND_URL}/captions`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
 
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            }
 
            const data = await response.json();
            renderSavedCaptions(data.captions || []);
 
        } catch (err) {
            console.error("Fetch saved captions error:", err);
            if (retryCount < 2 && err.message.includes("Failed to fetch")) {
                setTimeout(() => fetchSavedCaptions(retryCount + 1), 1500);
            } else {
                showToast("Could not load captions. Please try again.", "error");
                if (emptyMessage) emptyMessage.classList.remove('d-none');
            }
        } finally {
            if (loadingSpinner) loadingSpinner.classList.add('d-none');
        }
    }
 
    function renderSavedCaptions(captions) {
        if (!savedCaptionsList) return;
        savedCaptionsList.innerHTML = '';
 
        if (captions.length === 0) {
            if (emptyMessage) emptyMessage.classList.remove('d-none');
            return;
        }
 
        if (emptyMessage) emptyMessage.classList.add('d-none');
 
        captions.forEach(cap => {
            const card = document.createElement('div');
            card.className = 'col-md-6 mb-4';
 
            // ✅ Fixed: null date guard
            let dateStr = 'Unknown date';
            if (cap.createdAt) {
                try {
                    dateStr = new Date(cap.createdAt).toLocaleDateString();
                } catch (e) {
                    dateStr = 'Unknown date';
                }
            }
 
            card.innerHTML = `
                <div class="glass-card p-4 h-100 d-flex flex-column">
                    <div class="d-flex justify-content-between mb-3">
                        <span class="badge bg-secondary-subtle text-muted fw-normal" style="font-size: 0.7rem;">
                            ${cap.style || 'casual'} • ${cap.mood || 'none'}
                        </span>
                        <i class="bi bi-heart-fill text-danger small"></i>
                    </div>
                    <p class="text-light mb-4 flex-grow-1 lead-sm">"${cap.text}"</p>
                    <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top border-secondary-subtle">
                        <span class="badge bg-primary opacity-75">${cap.language || 'English'}</span>
                        <small class="text-muted" style="font-size: 0.7rem;">
                            <i class="bi bi-calendar3"></i> ${dateStr}
                        </small>
                    </div>
                    <button class="btn btn-xs btn-outline-light mt-2 copy-saved-btn" title="Copy">
                        <i class="bi bi-copy"></i> Copy
                    </button>
                </div>
            `;
            savedCaptionsList.appendChild(card);
 
            // Copy button
            card.querySelector('.copy-saved-btn').onclick = () => {
                navigator.clipboard.writeText(cap.text).then(() => {
                    showToast("Copied to clipboard!");
                });
            };
        });
    }
 
    // Wait for auth before fetching
    auth.onAuthStateChanged((user) => {
        if (user) {
            fetchSavedCaptions();
        } else {
            if (loadingSpinner) loadingSpinner.classList.add('d-none');
            if (emptyMessage) emptyMessage.classList.remove('d-none');
        }
    });
});
 












































