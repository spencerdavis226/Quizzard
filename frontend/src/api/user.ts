// Simple API for updating profile and password
import { getToken } from '../utils/token';

export async function updateProfile(data: {
  username?: string;
  email?: string;
}) {
  const token = getToken();
  const response = await fetch('/api/user/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update profile');
  }
  return response.json();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const token = getToken();
  const response = await fetch('/api/user/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to change password');
  }
  return response.json();
}

export async function deleteAccount() {
  const token = getToken();
  const response = await fetch('/api/user/me', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete account');
  }
  return response.json();
}
