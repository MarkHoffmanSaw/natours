import axios from 'axios';

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
    alert('Incorrect email or password');
    console.log(error);
  }
};
