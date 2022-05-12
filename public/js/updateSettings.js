import axios from 'axios';
import { showAlert } from './alerts';

export const updateData = async (data, type) => {
  try {
    const URL_DATA = `/api/v1/users/updateMe`;
    const URL_PASSWORD = `/api/v1/users/updateMyPassword`;

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
      location.assign('/me');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
