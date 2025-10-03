import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginCredentials, RegisterCredentials, AuthResponse, ApiError } from '../../types/auth.types';
import { AuthService } from '../../services/AuthService';


const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks for authentication actions
export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: ApiError }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Login failed',
        code: error.code,
        field: error.field,
      });
    }
  }
);

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterCredentials,
  { rejectValue: ApiError }
>(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Registration failed',
        code: error.code,
        field: error.field,
      });
    }
  }
);

export const refreshToken = createAsyncThunk<
  { token: string; refreshToken: string },
  void,
  { rejectValue: ApiError }
>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (!state.auth.refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await AuthService.refreshToken(state.auth.refreshToken);
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Token refresh failed',
        code: error.code,
      });
    }
  }
);

export const loadStoredAuth = createAsyncThunk<
  AuthResponse | null,
  void,
  { rejectValue: ApiError }
>(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const storedAuth = await AuthService.getStoredAuth();
      return storedAuth;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Failed to load stored authentication',
        code: error.code,
      });
    }
  }
);

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: ApiError }
>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Logout failed',
        code: error.code,
      });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Registration failed';
        state.isAuthenticated = false;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Token refresh failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });

    // Load Stored Auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadStoredAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load stored authentication';
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Logout failed';
      });
  },
});

export const { clearError, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;