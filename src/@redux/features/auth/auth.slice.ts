import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IUser } from '@/types/auth.types';

export interface AuthState {
    user: IUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<IUser>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
        },
        authLoading: (state) => {
            state.loading = true;
            state.error = null;
        },
        authFailed: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

// Action creators
export const { setUser, logout, authLoading, authFailed } = authSlice.actions;

// Export the reducer as default
export default authSlice.reducer; 