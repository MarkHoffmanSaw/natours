const login = async (email, password) => {
  console.log(email, password);

  try {
    const URL = `http://natours:3000/api/v1/users/login`;
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    console.log(data);
  } catch (error) {
    console.log(error);
  }
};

document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  login(email, password);
});
