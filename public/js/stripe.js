import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51Ky9wHGAyskpbiqGgP7QbPAnpDeVorpSMeoAAq0yMf48PIZ8sDZVKlMm5AhAxbKQZFyu1Zc5VkCXH7HsFlH6MNvX00sBalHhqj'
); // from script src (tour.pug)

export const bookTour = async (tourId) => {
  try {
    // 1. Get a checkout session from the API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    // Object w/ the session data
    console.log(session);

    // 2. Create a checkout form and charge a credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', 'You cannot pay now, try again later');
  }
};
