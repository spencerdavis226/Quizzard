// Simple API for updating profile and password
import { getToken } from '../utils/token';
import { API_URL } from '../config';

export async function updateProfile(data: {
  username?: string;
  email?: string;
}) {
  const token = getToken();
  const response = await fetch(`${API_URL}/user/me`, {
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
  const response = await fetch(`${API_URL}/user/change-password`, {
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
  const response = await fetch(`${API_URL}/user/me`, {
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

export async function getFriends() {
  const token = getToken();
  const response = await fetch(`${API_URL}/user/friends`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch friends');
  }
  return response.json();
}

export async function addFriend(username: string) {
  const token = getToken();
  const response = await fetch(`${API_URL}/user/friends`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add friend');
  }
  return response.json();
}

export async function removeFriend(username: string) {
  const token = getToken();
  const response = await fetch(`${API_URL}/user/friends`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to remove friend');
  }
  return response.json();
}

export async function getGlobalLeaderboard(
  sortBy: 'mana' | 'mageMeter' = 'mana',
  page: number = 1,
  limit: number = 10
) {
  const token = getToken();
  const response = await fetch(
    `${API_URL}/leaderboard/global?sortBy=${sortBy}&sortOrder=desc&page=${page}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch global leaderboard');
  }
  return response.json();
}

export async function getFriendLeaderboard(
  sortBy: 'mana' | 'mageMeter' = 'mana',
  page: number = 1,
  limit: number = 10
) {
  const token = getToken();
  const response = await fetch(
    `${API_URL}/leaderboard/friends?sortBy=${sortBy}&sortOrder=desc&page=${page}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch friend leaderboard');
  }
  return response.json();
}
