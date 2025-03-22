// import type { RequestHandler } from '@sveltejs/kit';
// import jwt from 'jsonwebtoken';
//
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
// const JWT_SECRET = process.env.JWT_SECRET;
//
// export const GET: RequestHandler = async ({ url, platform }) => {
//     const code = url.searchParams.get('code');
//
//     // Step 1: If no code provided, redirect to Google's OAuth2 consent screen.
//     if (!code) {
//         const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar');
//         const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
//             REDIRECT_URI
//         )}&response_type=code&scope=${scope}&access_type=offline`;
//         return Response.redirect(authUrl, 302);
//     }
//
//     // Step 2: Exchange the authorization code for an access token.
//     const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//         body: new URLSearchParams({
//             code,
//             client_id: GOOGLE_CLIENT_ID!,
//             client_secret: GOOGLE_CLIENT_SECRET!,
//             redirect_uri: REDIRECT_URI!,
//             grant_type: 'authorization_code'
//         })
//     });
//
//     const tokenData = await tokenResponse.json();
//     const access_token = tokenData.access_token;
//
//     // Step 3: Use the access token to retrieve basic user info.
//     const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
//         headers: { Authorization: `Bearer ${access_token}` }
//     });
//     const userData = await userResponse.json();
//     const { email, picture } = userData;
//
//     // Step 4: Create a JWT containing the access token and user data.
//     const jwtPayload = {
//         access_token,
//         email,
//         picture,
//         // Optionally set an expiration time, e.g., using tokenData.expires_in
//         exp: Math.floor(Date.now() / 1000) + tokenData.expires_in
//     };
//
//     const jwtToken = jwt.sign(jwtPayload, JWT_SECRET!);
//
//     // Step 5: Set the JWT in a secure, HTTP-only cookie.
//     const cookie = `token=${jwtToken}; Path=/; HttpOnly; Secure; SameSite=Lax;`;
//
//     // Redirect the user to the home page.
//     return new Response(null, {
//         status: 302,
//         headers: {
//             'Set-Cookie': cookie,
//             Location: '/'
//         }
//     });
// };