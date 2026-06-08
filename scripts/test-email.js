require('dotenv').config();

(async () => {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: ['charlyykeleb@gmail.com'],
        subject: 'Test Email',
        html: '<h1>Test</h1>',
      }),
    });

    const body = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', body);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
