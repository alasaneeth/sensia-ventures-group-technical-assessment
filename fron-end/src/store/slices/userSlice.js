
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';

const initialState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getAll();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateUserStatus',
  async ({ id, is_active }, { rejectWithValue }) => {
    try {
      return await userService.updateStatus(id, is_active);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user status');
    }
  }
);

export const updateUserRoles = createAsyncThunk(
  'users/updateUserRoles',
  async ({ id, roles }, { rejectWithValue }) => {
    try {
      await userService.updateRoles(id, roles);
      return { id, roles };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user roles');
    }
  }
);

export const updateUserPermissions = createAsyncThunk(
  'users/updateUserPermissions',
  async ({ id, permissions }, { rejectWithValue }) => {
    try {
      await userService.updatePermissions(id, permissions);
      return { id, permissions };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user permissions');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User Status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.user.id);
        if (index !== -1) {
          state.users[index] = action.payload.user;
        }
      })
      // Update User Roles
      .addCase(updateUserRoles.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index].roles = action.payload.roles;
        }
      });
  },
});

export const { clearCurrentUser, clearError } = userSlice.actions;
export default userSlice.reducer;