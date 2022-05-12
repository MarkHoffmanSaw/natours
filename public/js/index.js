import '@babel/polyfill';
// import { displayMap } from './mapbox';
import { signup } from './signup';
import { login, logout } from './login';
import { updateData } from './updateSettings';
// import { bookTour } from './stripe';

// DOM elements

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// Delegation

// Map
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// Signup
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name-reg').value;
    const email = document.getElementById('email-reg').value;
    const password = document.getElementById('password-reg').value;
    const passwordConfirm = document.getElementById(
      'password-confirm-reg'
    ).value;
    console.log(name, email, password, passwordConfirm);

    signup(name, email, password, passwordConfirm);
  });
}

// Login
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

// Logout
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// Update user data
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData();

    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    // form is Object: { name: ... , email... , photo: ... }
    updateData(form, 'data');
  });
}

// Update user password
if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateData(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

// Book the tour
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset; // auto converted 'data-tour-id' to 'tourId'
    bookTour(tourId);
  });
}
