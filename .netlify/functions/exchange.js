// netlify/functions/exchange.js
exports.handler = async (event) => {
	// Only allow GET
	if (event.httpMethod !== 'GET') {
		return {
			statusCode: 405,
			body: 'Method Not Allowed'
		};
	}

	// ?code=... comes from GitHub's redirect
	const code = event.queryStringParameters.code;
	if (!code) {
		return { statusCode: 400, body: 'Missing "code" query-param' };
	}

	// Build the form data GitHub expects
	const body = new URLSearchParams({
		client_id: process.env.GITHUB_CLIENT_ID,
		client_secret: process.env.GITHUB_CLIENT_SECRET,
		code
	});

	// Exchange the code for an access token
	const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { Accept: 'application/json' },
		body
	});

	const data = await tokenResp.json();

	if (!tokenResp.ok || !data.access_token) {
		return {
			statusCode: 502,
			body: JSON.stringify({ error: 'GitHub token exchange failed', data })
		};
	}

	// ⚠️  Simplest path: just return the token to the SPA
	//     If you prefer an HTTP-only cookie, set it here instead.
	return {
		statusCode: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',	// tweak for prod as needed
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token: data.access_token })
	};
};
