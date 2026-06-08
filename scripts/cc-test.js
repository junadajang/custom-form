require('dotenv').config();
const { getAccessToken } = require('../lib/cc-auth');

(async () => {
  try {
    const token = await getAccessToken();
    console.log('Got access token:', token.substring(0, 20) + '...');

    // Test the exact same call the app makes
    const contactBody = {
      email_address: 'charlyykeleb@gmail.com',
      first_name: 'Test',
      last_name: 'User',
      list_memberships: [process.env.CC_LIST_ID_APR_MV],
    };

    console.log('\nSending to CC API:');
    console.log(JSON.stringify(contactBody, null, 2));

    const res = await fetch('https://api.cc.email/v3/contacts/sign_up_form', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactBody),
    });

    const body = await res.text();
    console.log('\nResponse status:', res.status);
    console.log('Response body:', body);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
