require('dotenv').config();

(async () => {
  const creds = Buffer.from(
    process.env.CC_CLIENT_ID + ':' + process.env.CC_CLIENT_SECRET
  ).toString('base64');

  const tokenRes = await fetch('https://authz.constantcontact.com/oauth2/default/v1/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + creds,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'refresh_token=' + encodeURIComponent(process.env.CC_REFRESH_TOKEN) + '&grant_type=refresh_token',
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error('Token error:', tokenData);
    return;
  }

  const listRes = await fetch('https://api.cc.email/v3/contact_lists', {
    headers: { Authorization: 'Bearer ' + tokenData.access_token },
  });

  const listData = await listRes.json();
  console.log('\nYour Constant Contact Lists:\n');
  (listData.lists || []).forEach(function (l) {
    console.log('  ' + l.list_id + '  →  ' + l.name);
  });
  console.log('');
})();
