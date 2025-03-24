export function load({ url }) {
	const logout = url.searchParams.get('logout');

	return { logout };
}
