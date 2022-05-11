import axios from 'axios';
import { showAlert } from './alerts';

// const stripe = Stripe(
//   'pk_test_51Ky9wHGAyskpbiqGgP7QbPAnpDeVorpSMeoAAq0yMf48PIZ8sDZVKlMm5AhAxbKQZFyu1Zc5VkCXH7HsFlH6MNvX00sBalHhqj'
// ); // from script src (tour.pug)

export const bookTour = async (tourId) => {
  try {
    // 1. Get a checkout session from the API
    await axios({
      method: 'POST',
      url: `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', 'You cannot pay now, try again later');
  }
};
