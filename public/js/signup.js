import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const URL = `/api/v1/users/signup`;
    const res = await axios({
      method: 'POST',
      url: URL,
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'You have registered successfully');
      location.assign('/');
    }
  } catch (error) {
    showAlert('error', error.message);
    // console.log(error);
  }
};
