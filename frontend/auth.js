const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const authAlert = document.getElementById('auth-alert');

function showAlert(message, type = 'error') {
  authAlert.textContent = message;
  authAlert.className = `auth-alert ${type}`;
}

function clearAlert() {
  authAlert.className = 'auth-alert';
  authAlert.textContent = '';
}

function showPanel(panelName) {
  clearAlert();
  loginForm.classList.toggle('hidden', panelName !== 'login');
  registerForm.classList.toggle('hidden', panelName !== 'register');
  forgotPasswordForm.classList.toggle('hidden', panelName !== 'forgot');
  resetPasswordForm.classList.toggle('hidden', panelName !== 'reset');

  tabLogin.classList.toggle('active', panelName === 'login');
  tabRegister.classList.toggle('active', panelName === 'register');
  document.querySelector('.auth-tabs').classList.toggle('hidden', panelName === 'forgot' || panelName === 'reset');
}

tabLogin.addEventListener('click', () => {
  showPanel('login');
});

tabRegister.addEventListener('click', () => {
  showPanel('register');
});

document.getElementById('forgot-password-link')?.addEventListener('click', () => showPanel('forgot'));
document.getElementById('reset-password-link')?.addEventListener('click', () => showPanel('reset'));
document.getElementById('back-to-login')?.addEventListener('click', () => showPanel('login'));
document.getElementById('reset-back-to-login')?.addEventListener('click', () => showPanel('login'));

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const displayName = res.user.full_name || res.user.name || 'User';
    showAlert(`Welcome back, ${displayName}! Redirecting...`, 'success');
    setTimeout(() => {
      window.location.href = './index.html';
    }, 800);
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  const full_name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, phone, password })
    });
    showAlert(`Account created for ${res.user.full_name}! Redirecting...`, 'success');
    setTimeout(() => {
      window.location.href = './index.html';
    }, 800);
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

forgotPasswordForm.addEventListener('submit', async (e) => {
  e.preventEvent?.();
  e.preventDefault();
  clearAlert();

  const email = document.getElementById('forgot-email').value.trim();
  try {
    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    if (res.resetToken) {
      document.getElementById('reset-token').value = res.resetToken;
      showPanel('reset');
      showAlert('Reset token generated and pre-filled. It expires in 15 minutes.', 'success');
    } else {
      showAlert(res.message, 'success');
    }
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  const token = document.getElementById('reset-token').value.trim();
  const newPassword = document.getElementById('reset-new-password').value;
  const confirmPassword = document.getElementById('reset-confirm-password').value;

  if (newPassword !== confirmPassword) {
    showAlert('Passwords do not match.', 'error');
    return;
  }

  try {
    const res = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
    showPanel('login');
    showAlert(res.message, 'success');
    resetPasswordForm.reset();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

const urlResetToken = new URLSearchParams(window.location.search).get('resetToken');
if (urlResetToken) {
  document.getElementById('reset-token').value = urlResetToken;
  showPanel('reset');
}