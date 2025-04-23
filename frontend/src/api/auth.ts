// USER LOGIN
export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    // Explicitly set the header so the server expects JSON
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  // Check if the response status is not in the range 200-299 (indicating an error)
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to login');
  }

  return response.json(); // Expected to return { token: string }
}

// USER REGISTRATION
export async function register(
  username: string,
  email: string,
  password: string
) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to register');
  }

  return response.json(); // Expected to return { token: string }
}
