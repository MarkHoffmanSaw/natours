import axios from 'axios';
import { showAlert } from './alerts';

export const updateData = async (data, type) => {
  try {
    const URL_DATA = `http://127.0.0.1:3000/api/v1/users/updateMe`;
    const URL_PASSWORD = `http://127.0.0.1:3000/api/v1/users/updateMyPassword`;

    const res = await axios({
      method: 'PATCH',
      url: type === 'password' ? URL_PASSWORD : URL_DATA,
      data,
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        `You have successfully updated ${type.toUpperCase()}`
      );
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
