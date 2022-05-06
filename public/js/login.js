import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const URL = `http://127.0.0.1:3000/api/v1/users/login`;
    const res = await axios({
      method: 'POST',
      url: URL,
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      console.log('You have logged in successfully');
      location.assign('/');
    }
  } catch (error) {
    showAlert('error', 'Incorrect email or password');
    // console.log(error);
  }
};

export const logout = async () => {
  try {
    const URL = `http://127.0.0.1:3000/api/v1/users/logout`;
    const res = await axios({
      method: 'GET',
      url: URL,
    });

    if (res.data.status === 'success') location.reload(true);
  } catch (error) {
    showAlert('error', 'Error with logging out! Try again');
  }
};
