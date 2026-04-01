import { bootstrapPage, formatCurrency, showToast } from "./app.js";
import { requireAuth } from "./app.js";
import { getCurrentUser, getUsers, saveUsers, setCurrentUser, getOrders, updateUserProfile } from "./data.js";

bootstrapPage();
const user = requireAuth();

// Load profile data
function loadProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    document.getElementById('profileName').textContent = currentUser.fullName;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profilePhone').textContent = currentUser.phone || 'Not set';
    document.getElementById('profileType').textContent = currentUser.userType.charAt(0).toUpperCase() + currentUser.userType.slice(1);
    document.getElementById('profilePlan').textContent = currentUser.subscription.charAt(0).toUpperCase() + currentUser.subscription.slice(1);
    document.getElementById('profileSince').textContent = new Date(currentUser.createdAt).toLocaleDateString('en-IN');
    document.getElementById('profileLastLogin').textContent = currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString('en-IN') : 'Never';

    // Fill form
    document.getElementById('updateName').value = currentUser.fullName;
    document.getElementById('updatePhone').value = currentUser.phone || '';
    document.getElementById('updateCompany').value = currentUser.company || '';
    document.getElementById('updateAddress').value = currentUser.address || '';

    // Load account statistics
    loadAccountStats(currentUser.id);

    // Highlight current plan
    document.querySelectorAll('.plan-card').forEach(card => {
        const plan = card.dataset.plan;
        if (plan === currentUser.subscription) {
            card.style.border = '2px solid #f4b400';
            card.querySelector('button').textContent = 'Current Plan';
            card.querySelector('button').disabled = true;
        } else {
            card.style.border = 'none';
            const btn = card.querySelector('button');
            btn.textContent = `Switch to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
            btn.disabled = false;
        }
    });
}

function loadAccountStats(userId) {
    const userOrders = getOrders().filter(order => order.userId === userId);
    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('avgOrderValue').textContent = formatCurrency(avgOrderValue);
}

// Handle profile update
document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentUser = getCurrentUser();
    const newPassword = document.getElementById('updatePassword').value;
    const confirmPassword = document.getElementById('updateConfirmPassword').value;

    if (newPassword && newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    const updatedData = {
        fullName: document.getElementById('updateName').value,
        phone: document.getElementById('updatePhone').value,
        company: document.getElementById('updateCompany').value,
        address: document.getElementById('updateAddress').value
    };

    if (newPassword) {
        updatedData.password = newPassword;
    }

    const success = updateUserProfile(currentUser.id, updatedData);

    if (success) {
        showToast('Profile updated successfully!', 'success');
        loadProfile(); // Reload profile data
        // Clear password fields
        document.getElementById('updatePassword').value = '';
        document.getElementById('updateConfirmPassword').value = '';
    } else {
        showToast('Failed to update profile', 'error');
    }
});

// Handle plan change
document.querySelectorAll('.change-plan-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const plan = btn.dataset.plan;
        const currentUser = getCurrentUser();

        if (plan === currentUser.subscription) {
            showToast('This is already your current plan', 'info');
            return;
        }

        // Confirm plan change
        const confirmMsg = confirm(`Are you sure you want to switch to ${plan.toUpperCase()} plan? ${plan === 'premium' ? '₹1999/month' : plan === 'basic' ? '₹999/month' : 'Free'} will be charged.`);
        if (!confirmMsg) return;

        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].subscription = plan;
            saveUsers(users);

            // Update current session
            const updatedUser = { ...currentUser, subscription: plan };
            setCurrentUser(updatedUser, true);

            showToast(`Successfully switched to ${plan.toUpperCase()} plan!`, 'success');
            loadProfile(); // Reload profile
        }
    });
});

loadProfile();